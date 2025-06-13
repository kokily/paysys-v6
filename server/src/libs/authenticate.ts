import type { SignOptions } from 'jsonwebtoken';
import type { Context } from 'koa';
import jwt, {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from 'jsonwebtoken';
import User from '../entities/User';
import { dataSource } from '../server';
import Token from '../entities/Token';
import { isProd } from './utils';

type JwtPayloadType = string | object | Buffer;

/**
 * @template T      페이로드 타입
 * @param payload   JWT에 포함될 데이터
 * @param options   JWT 서명 옵션
 * @returns         생성된 WJT 문자열을 포함하는 Promise
 * @throws {Error}  JWT_SECRET 환경변수가 설정되지 않았거나 JWT 생성실패
 */
async function generateToken<T extends JwtPayloadType>(
  payload: T,
  options?: SignOptions,
): Promise<string> {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const defaultOptions: SignOptions = {
    issuer: 'paysys.kr',
    expiresIn: '15d',
  };

  const jwtOptions: SignOptions = {
    ...defaultOptions,
    ...options,
  };

  if (options?.expiresIn === undefined) {
    delete jwtOptions.expiresIn;
  }

  return new Promise((resolve, reject) => {
    jwt.sign(payload, secretKey, jwtOptions, (err, token) => {
      if (err) {
        reject(err);
      } else if (token === undefined) {
        reject(new Error('Failed to generate token: token is undefined'));
      } else {
        resolve(token);
      }
    });
  });
}

type AccessTokenPayload = {
  user_id: string;
  username: string;
  admin: boolean;
};

type RefreshTokenPayload = {
  token_id: string;
} & AccessTokenPayload;

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

/**
 * @param user      토큰을 생성할 User Entity
 * @returns         Access Token과 Refresh Token을 포함하는 객체 Promise
 * @throws {Error}  데이터베이스 작업 또는 토큰 생성에 실패한 경우
 */
async function createToken(user: User): Promise<TokenPair> {
  const tokenRepo = dataSource.getRepository(Token);
  const token = new Token();

  token.fk_user_id = user.id;

  await tokenRepo.save(token);

  const accessTokenPayload: AccessTokenPayload = {
    user_id: user.id,
    username: user.username,
    admin: user.admin,
  };

  const accessToken = await generateToken<AccessTokenPayload>(
    accessTokenPayload,
    {
      subject: 'access_token',
      expiresIn: '15m',
    },
  );

  const refreshTokenPayload: RefreshTokenPayload = {
    user_id: user.id,
    username: user.username,
    admin: user.admin,
    token_id: token.id,
  };

  const refreshToken = await generateToken<RefreshTokenPayload>(
    refreshTokenPayload,
    {
      subject: 'refresh_token',
      expiresIn: '15d',
    },
  );

  token.token = refreshToken;

  await tokenRepo.save(token);

  return {
    accessToken,
    refreshToken,
  };
}

type DecodedJwtPayload = {
  iat?: number;
  exp?: number;
  nbf?: number;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  jti?: string;
};

/**
 * @template T      디코딩될 페이로드의 예상 타입
 * @param token     디코딩할 JWT 문자열
 * @returns         디코딩된 페이로드 객체를 포함하는 Promise
 * @thorws {Error}  JWT_SECRET 환경변수 누락 또는 토큰 검증/디코딩 실패
 */
async function decodeToken<T extends DecodedJwtPayload = any>(
  token: string,
): Promise<T> {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error(
      'JWT_SECRET environment variable is not set for token decoding',
    );
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        const actualError = err as Error;

        if (actualError instanceof TokenExpiredError) {
          reject(new Error('TokenExpiredError: JWT token has expired'));
        } else if (actualError instanceof JsonWebTokenError) {
          reject(new Error(`JsonWebTokenError: ${actualError.message}`));
        } else if (actualError instanceof NotBeforeError) {
          reject(
            new Error(
              `NotBeforeError: JWT token not active yet. ${actualError.message}`,
            ),
          );
        } else {
          reject(actualError);
        }
      } else if (decoded === undefined) {
        reject(
          new Error(
            'Failed to decode token: 디코딩된 페이로드가 정의되지 않았습니다.',
          ),
        );
      } else {
        resolve(decoded as T);
      }
    });
  });
}

/**
 * @param ctx       Koa의 Context 객체
 * @param tokens    설정할 액세스, 리프레쉬 토큰 객체
 */
export function setCookies(ctx: Context, tokens?: TokenPair): void {
  const baseCookieOptions = {
    domain: isProd ? '.paysys.kr' : undefined,
    secure: isProd,
    sameSite: 'lax' as const,
    httpOnly: true,
  };

  if (tokens) {
    ctx.cookies.set('access_token', tokens.accessToken, {
      ...baseCookieOptions,
      maxAge: 1000 * 60 * 15,
    });

    ctx.cookies.set('refresh_token', tokens.refreshToken, {
      ...baseCookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  } else {
    ctx.cookies.set('access_token', '', {
      ...baseCookieOptions,
      maxAge: 0,
    });

    ctx.cookies.set('refresh_token', '', {
      ...baseCookieOptions,
      maxAge: 0,
    });
  }
}

export type DecodedBaseTokenType = {
  iat: number;
  exp: number;
  iss?: string;
  sub?: string;
};

export type AccessTokenType = {
  user_id: string;
  username: string;
  admin: boolean;
};

export type RefreshTokenType = {
  token_id: string; // 데이터베이스의 Token 엔티티 ID
} & AccessTokenType;

export type DecodedAccessTokenType = AccessTokenPayload & DecodedBaseTokenType;
export type DecodedRefreshTokenType = RefreshTokenPayload &
  DecodedBaseTokenType;

const ACCESS_TOKEN_EXPIRES_IN_MINUTES = 15;
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 15;
const REFRESH_TOKEN_REISSUE_THRESHOLD_DAYS = 15;

/**
 * @param ctx               Koa Context 객체
 * @param prevRefreshToken  이전 클라이언트로부터 받은 리프레쉬 토큰 문자열
 * @returnes                갱신된 사용자 ID
 * @throws {HttpError}      유효하지 않은 토큰, 사용자 없음, 기타 서버 오류
 */
export async function tokenRefresh(
  ctx: Context,
  prevRefreshToken: string,
): Promise<string> {
  try {
    const decoded = await decodeToken<DecodedRefreshTokenType>(
      prevRefreshToken,
    );

    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: decoded.user_id });

    if (!user) {
      ctx.throw(401, 'Invalid User Error: User not found for token');
    }

    const now = Math.floor(Date.now() / 1000);
    const diffInSeconds = decoded.exp - now;
    const diffInDays = diffInSeconds / (60 * 60 * 24);

    let refreshToken = prevRefreshToken;

    // 리프레쉬 토큰의 만료가 15일 이내면 새로 발급
    if (diffInDays < REFRESH_TOKEN_REISSUE_THRESHOLD_DAYS) {
      const newRefreshTokenPayload: RefreshTokenPayload = {
        user_id: user.id,
        username: user.username,
        admin: user.admin,
        token_id: decoded.token_id,
      };

      refreshToken = await generateToken<RefreshTokenPayload>(
        newRefreshTokenPayload,
        {
          subject: 'refresh_token',
          expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
        },
      );
    }

    // 새로운 Access Token 발급
    const newAccessTokenPayload: AccessTokenPayload = {
      user_id: user.id,
      username: user.username,
      admin: user.admin,
    };

    const accessToken = await generateToken<AccessTokenPayload>(
      newAccessTokenPayload,
      {
        subject: 'access_token',
        expiresIn: `${ACCESS_TOKEN_EXPIRES_IN_MINUTES}m`,
      },
    );

    setCookies(ctx, { accessToken, refreshToken });

    const tokenRepo = dataSource.getRepository(Token);

    await tokenRepo.update(
      { id: decoded.token_id },
      {
        token: refreshToken,
      },
    );

    return decoded.user_id;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      ctx.throw(401, 'Token Expired: Refresh token has expired');
    } else if (err instanceof JsonWebTokenError) {
      ctx.throw(401, `Invalid Token: ${err.message}`);
    } else if (err instanceof NotBeforeError) {
      ctx.throw(401, `Token Not Active: ${err.message}`);
    } else if (err instanceof Error) {
      ctx.throw(500, `Internal Server Error: ${err.message}`);
    } else {
      ctx.throw(500, 'An unknown error occured during token refresh');
    }
  }
}

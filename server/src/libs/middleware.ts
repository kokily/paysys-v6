import { Context, Next } from 'koa';
import {
  DecodedRefreshTokenType,
  decodeToken,
  setCookies,
  tokenRefresh,
} from './authenticate';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { dataSource } from '../server';
import User from '../entities/User';
import { IS_PROD } from './constants';

/**
 * 사용자 인증 확인 미들웨어
 * @param ctx           Koa Context 객체
 * @param next          Next 미들웨어 함수
 * @returns             Next 미들웨어 실행 Promise
 * @throws {HttpError}  사용자 인증 X, 유효하지 않은 경우 401
 */
export async function authorizedUser(ctx: Context, next: Next): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const UNAUTHORIZED_MESSAGE = '로그인 후 이용해 주세요';

  const decodedUser = ctx.state.user;

  if (!decodedUser || !decodedUser.user_id) {
    ctx.throw(401, UNAUTHORIZED_MESSAGE);
  }

  const user = await userRepo.findOneBy({ id: decodedUser.user_id });

  if (!user) {
    ctx.throw(401, UNAUTHORIZED_MESSAGE);
  }

  await next();
}

export async function authorizedAdmin(ctx: Context, next: Next): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const UNAUTHORIZED_MESSAGE = '로그인 후 이용해 주세요';

  const decodedUser = ctx.state.user;

  if (!decodedUser || !decodedUser.user_id) {
    ctx.throw(401, UNAUTHORIZED_MESSAGE);
  }

  const user = await userRepo.findOneBy({ id: decodedUser.user_id });

  if (!user) {
    ctx.throw(401, UNAUTHORIZED_MESSAGE);
  }

  if (!user.admin) {
    ctx.throw(403, '관리자 권한이 없습니다.');
  }

  await next();
}

const REFRESH_THRESHOLD_MS = 1000 * 60 * 30;

export async function jwtMiddleware(ctx: Context, next: Next) {
  let accessToken: string | undefined = ctx.cookies.get('access_token');
  let refreshToken: string | undefined = ctx.cookies.get('refresh_token');

  if (!accessToken && !refreshToken) {
    ctx.state.user = undefined;
    return next();
  }

  try {
    let decodedRefreshToken: DecodedRefreshTokenType | undefined;

    if (refreshToken) {
      decodedRefreshToken = await decodeToken<DecodedRefreshTokenType>(
        refreshToken,
      );

      // 만료 30분 이내 or AccessToken이 없는 경우 토큰 갱신
      const now = new Date().getTime();
      const diff = decodedRefreshToken.exp * 1000 - now;

      if (!accessToken || diff < REFRESH_THRESHOLD_MS) {
        await tokenRefresh(ctx, refreshToken);

        accessToken = ctx.cookies.get('access_token');
        refreshToken = ctx.cookies.get('refresh_token');

        if (refreshToken) {
          decodedRefreshToken = await decodeToken<DecodedRefreshTokenType>(
            refreshToken,
          );
        } else {
          ctx.state.user = undefined;
          setCookies(ctx);

          return next();
        }
      }

      if (decodedRefreshToken) {
        ctx.state.user = {
          user_id: decodedRefreshToken.user_id,
          username: decodedRefreshToken.username,
          admin: decodedRefreshToken.admin,
        };
      }

      return next();
    } else if (accessToken && !refreshToken) {
      ctx.state.user = undefined;
      setCookies(ctx);
      return next();
    }
  } catch (error) {
    ctx.state.user = undefined;
    setCookies(ctx);

    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError
    ) {
      // authorized 미들웨어를 통해 401을 뿜도록
      return next();
    } else {
      return next();
    }
  }
}

export function cors(ctx: Context, next: Next) {
  const allowedHosts = [/^https:\/\/paysys.kr$/, /^https:\/\/image.paysys.kr$/];

  if (!IS_PROD) {
    allowedHosts.push(/^http:\/\/localhost/);
  }

  const { origin } = ctx.headers;

  if (origin) {
    const valid = allowedHosts.some((regex) => regex.test(origin));

    if (!valid) return next();

    ctx.set('Access-Control-Allow-Origin', origin);
    ctx.set('Access-Control-Allow-Credentials', 'true');

    if (ctx.method === 'OPTIONS') {
      ctx.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Cookie',
      );
      ctx.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE,PATCH');
    }

    return next();
  } else {
    return next();
  }
}

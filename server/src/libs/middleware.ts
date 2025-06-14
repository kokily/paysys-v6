import { Context, Next } from 'koa';
import {
  DecodedRefreshTokenType,
  decodeToken,
  setCookies,
  tokenRefresh,
} from './authenticate';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * 사용자 인증 확인 미들웨어
 * @param ctx           Koa Context 객체
 * @param next          Next 미들웨어 함수
 * @returns             Next 미들웨어 실행 Promise
 * @throws {HttpError}  사용자 인증 X, 유효하지 않은 경우 401
 */
export async function authorizedUser(ctx: Context, next: Next): Promise<void> {}

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

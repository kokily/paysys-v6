import 'koa';
import User from '../entities/User';
import { AccessTokenType } from '../libs/authenticate';

declare module 'koa' {
  interface DefaultState {
    user?: AccessTokenType;
  }
}

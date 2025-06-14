import type { Context } from 'koa';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { validateBody } from '../../libs/utils';
import { dataSource } from '../../server';
import User from '../../entities/User';
import Token from '../../entities/Token';
import { createToken, setCookies } from '../../libs/authenticate';

type AuthPayload = {
  username: string;
  password: string;
};

// Login API
export async function loginAPI(ctx: Context) {
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().min(4).required(),
  });

  if (!validateBody(ctx, schema)) return;

  const { username, password }: AuthPayload = ctx.request.body;

  try {
    const userRepo = dataSource.getRepository(User);
    const tokenRepo = dataSource.getRepository(Token);
    const user = await userRepo.findOneBy({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      const prevToken = await tokenRepo.findOneBy({ fk_user_id: user.id });

      if (prevToken) {
        await tokenRepo.delete({ fk_user_id: user.id });
      }

      const tokens = await createToken(user);

      setCookies(ctx, tokens);

      ctx.body = {
        user_id: user.id,
        username: username,
        admin: user.admin,
      };
    } else {
      ctx.status = 401;
      ctx.body = '사용자가 없거나 비밀번호가 틀렸습니다.';
      return;
    }
  } catch (error) {
    console.error('Login API Error', error);

    if (error instanceof Error) {
      ctx.throw(500, `Internal Server Error: ${error.message}`);
    } else {
      ctx.throw(500, '알 수 없는 서버 오류가 발생했습니다.');
    }
  }
}

// Register API
export async function registerAPI(ctx: Context) {
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().min(4).required(),
  });

  if (!validateBody(ctx, schema)) return;

  const { username, password }: AuthPayload = ctx.request.body;

  try {
    const userRepo = dataSource.getRepository(User);
    const exists = await userRepo.findOneBy({ username });

    if (exists) {
      ctx.status = 409;
      ctx.body = '이미 사용중인 아이디입니다.';
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = userRepo.create({
      username: username,
      password: hashedPassword,
      admin: false,
    });

    await userRepo.save(user);

    ctx.body = user.serialize();
  } catch (error) {
    console.error('Register API Error', error);

    if (error instanceof Error) {
      ctx.throw(500, `Internal Server Error: ${error.message}`);
    } else {
      ctx.throw(500, '알 수 없는 서버 오류가 발생했습니다.');
    }
  }
}

// Logout API
export async function logoutAPI(ctx: Context) {
  try {
    const { user_id } = ctx.state.user!;
    const userRepo = dataSource.getRepository(User);
    const tokenRepo = dataSource.getRepository(Token);
    const user = await userRepo.findOneBy({ id: user_id });

    if (!user) {
      ctx.status = 401;
      ctx.body = '로그인 후 이용하세요';
      return;
    }

    const token = await tokenRepo.findOneBy({ fk_user_id: user.id });

    if (!token) {
      ctx.status = 401;
      ctx.body = '토큰이 존재하지 않습니다.';
      return;
    }

    setCookies(ctx);

    ctx.state.user = undefined;

    await tokenRepo.delete(token.id);

    ctx.status = 204;
  } catch (error) {
    console.error('Logout API Error', error);

    if (error instanceof Error) {
      ctx.throw(500, `Internal Server Error: ${error.message}`);
    } else {
      ctx.throw(500, '알 수 없는 서버 오류가 발생했습니다.');
    }
  }
}

// Check Me API
export async function checkAPI(ctx: Context) {
  try {
    const { user_id } = ctx.state.user!;

    if (!user_id) {
      ctx.throw(401, '로그인 후 사용해 주세요');
    }

    const userRepo = dataSource.getRepository(User);
    const tokenRepo = dataSource.getRepository(Token);
    const user = await userRepo.findOneBy({ id: user_id });

    if (!user) {
      ctx.status = 401;
      ctx.body = '로그인 후 사용해 주세요';
      return;
    }

    const token = await tokenRepo.findOneBy({ fk_user_id: user.id });

    if (!token) {
      ctx.status = 401;
      ctx.body = '토큰이 존재하지 않습니다.';
      return;
    }

    ctx.body = {
      user_id,
      username: user.username,
      admin: user.admin,
    };
  } catch (error) {
    console.error('User Check API Error', error);

    if (error instanceof Error) {
      ctx.throw(500, `Internal Server Error: ${error.message}`);
    } else {
      ctx.throw(500, '알 수 없는 서버 오류가 발생했습니다.');
    }
  }
}

import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import bodyParser from 'koa-body';
import serve from 'koa-static';
import send from 'koa-send';
import path from 'path';
import api from './api';
import { cors, jwtMiddleware } from './libs/middleware';

const app = new Koa();
const router = new Router();

const rootDir = path.resolve(process.cwd(), './../client');

app.use(bodyParser({ multipart: true }));
app.use(cors);
app.use(logger());
app.use(jwtMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());
app.use(serve(rootDir));
app.use(async (ctx) => {
  if (ctx.status === 404 && ctx.path.indexOf('/api') !== 0) {
    await send(ctx, 'index.html', {
      root: rootDir,
    });
  }
});

router.use('/api', api.routes());
router.use('/api', api.allowedMethods());

export default app;

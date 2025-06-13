import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import serve from 'koa-static';
import send from 'koa-send';
import path from 'path';
import api from './api';

const app = new Koa();
const router = new Router();

const rootDir = path.resolve(process.cwd(), './../client');

app.use(logger());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(serve(rootDir));
app.use(async (ctx) => {
  await send(ctx, 'index.html', {
    root: rootDir,
  });
});

router.use('/api', api.routes());

export default app;

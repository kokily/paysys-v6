import Router from 'koa-router';
import auth from './auth';
import items from './items';

const api = new Router();

api.use('/auth', auth.routes());
api.use('/items', items.routes());

export default api;

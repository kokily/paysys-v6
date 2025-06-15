import Router from 'koa-router';
import { addItemAPI } from './items.ctrl';

const items = new Router();

items.post('/add', addItemAPI);

export default items;

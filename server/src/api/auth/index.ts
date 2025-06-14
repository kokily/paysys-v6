import Router from 'koa-router';
import { checkAPI, loginAPI, logoutAPI, registerAPI } from './auth.ctrl';

const auth = new Router();

auth.post('/login', loginAPI);
auth.post('/register', registerAPI);
auth.post('/logout', logoutAPI);
auth.get('/check', checkAPI);

export default auth;

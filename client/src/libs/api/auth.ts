import type { AuthPayload } from '../stores/auth';
import { type MeType } from '../stores/user';
import client from './client';

export async function loginAPI(payload: AuthPayload) {
  const response = await client.post<MeType>('/auth/login', payload);
  return response.data;
}

export async function registerAPI(payload: AuthPayload) {
  const response = await client.post<MeType>('/auth/register', payload);
  return response.data;
}

export async function logoutAPI() {
  const response = await client.post('/auth/logout');
  return response.data;
}

export async function checkAPI() {
  const response = await client.get<MeType>('/auth/check');
  return response.data;
}

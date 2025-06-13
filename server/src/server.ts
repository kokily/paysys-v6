import 'dotenv/config';
import http from 'http';
import { DataSource } from 'typeorm';
import app from './app';
import entities from './entities';

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: false,
  logging: true,
  entities,
});

async function _bootStrap() {
  try {
    await dataSource.initialize();

    let httpServer = http.createServer(app.callback());

    httpServer.listen(4000, () => {
      console.log('Server on...');
    });
  } catch (err: any) {
    console.log(err);
  }
}

_bootStrap();

import 'dotenv/config';
import { DataSource } from 'typeorm';

const databasePort = parseInt(process.env.DATABASE_PORT || '5432', 10);

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: databasePort,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: ['error', 'warn'],
});

import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
  ssl: boolean | { ca: string };
}

export default registerAs<DatabaseConfig>('database', () => {
  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    schema: process.env.DB_SCHEMA!,
    ssl: process.env.DB_RDS_CA_BASE64
      ? {
          ca: Buffer.from(process.env.DB_RDS_CA_BASE64, 'base64').toString('utf-8'),
        }
      : false,
  };
});

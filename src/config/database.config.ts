import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean | { rejectUnauthorized: boolean };
}

export default registerAs<DatabaseConfig>('database', () => {
  const sslEnabled = process.env.DB_SSL !== 'false';

  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  };
});

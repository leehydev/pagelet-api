import { DatabaseConfig } from '@/config/database.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { addTransactionalDataSource } from 'typeorm-transactional';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database');
        const IS_PRODUCTION = process.env.NODE_ENV === 'production';

        const { host, port, username, password, database, ssl } = dbConfig!;

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          ssl,
          autoLoadEntities: true,
          synchronize: false,
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsRun: !IS_PRODUCTION,
          namingStrategy: new SnakeNamingStrategy(),
          logging: process.env.NODE_ENV !== 'production', // 운영에서는 false
        };
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async dataSourceFactory(options) {
        if (!options) throw new Error('Invalid TypeORM options');
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
  ],
})
export class DatabaseModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { GroupModule } from './modules/group/group.module';
import { MembershipModule } from './modules/membership/membership.module';
import { Membership } from './modules/membership/membership.entity';
import { User } from './modules/user/user.entity';
import { Group } from './modules/group/group.entity';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const databaseSsl = (configService.get<string>('DATABASE_SSL') || '').toLowerCase() === 'true';
        const databaseSchema = configService.get<string>('DB_SCHEMA') || 'public';

        return {
          type: 'postgres',
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: configService.get<string>('DATABASE_HOST') || 'localhost',
                port: Number(configService.get<string>('DATABASE_PORT') || 5432),
                username: configService.get<string>('DATABASE_USERNAME') || 'postgres',
                password: configService.get<string>('DATABASE_PASSWORD') || 'postgres',
                database: configService.get<string>('DATABASE_NAME') || 'fitconnect_community',
              }),
          ...(databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
          schema: databaseSchema,
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') !== 'production',
          entities: [User, Group, Membership],
          migrations: ['dist/migrations/*.js'],
          migrationsTableName: 'migrations',
        };
      },
    }),
    UserModule,
    GroupModule,
    MembershipModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

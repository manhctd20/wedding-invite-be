import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { InvitationsModule } from './invitations/invitations.module'
import { TemplatesModule } from './templates/templates.module'
import { AdminModule } from './admin/admin.module'
import { User } from './users/user.entity'
import { Invitation } from './invitations/invitation.entity'
import { Template } from './templates/template.entity'
import { Guestbook } from './invitations/guestbook.entity'
import { Rsvp } from './invitations/rsvp.entity'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [User, Invitation, Template, Guestbook, Rsvp],
        synchronize: true, // dev only — auto-create schema
      }),
    }),
    AuthModule,
    UsersModule,
    InvitationsModule,
    TemplatesModule,
    AdminModule,
  ],
})
export class AppModule {}

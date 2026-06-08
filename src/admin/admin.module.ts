import { Module } from '@nestjs/common'
import { AdminService } from './admin.service'
import { AdminController } from './admin.controller'
import { UsersModule } from '../users/users.module'
import { InvitationsModule } from '../invitations/invitations.module'
import { TemplatesModule } from '../templates/templates.module'

@Module({
  imports: [UsersModule, InvitationsModule, TemplatesModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}

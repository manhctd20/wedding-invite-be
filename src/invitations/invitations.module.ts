import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Invitation } from './invitation.entity'
import { Guestbook } from './guestbook.entity'
import { Rsvp } from './rsvp.entity'
import { InvitationsService } from './invitations.service'
import { InvitationsController, PublicInvitationsController } from './invitations.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Invitation, Guestbook, Rsvp])],
  providers: [InvitationsService],
  controllers: [InvitationsController, PublicInvitationsController],
  exports: [InvitationsService],
})
export class InvitationsModule {}

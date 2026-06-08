import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { InvitationsService } from './invitations.service'
import { UpsertInvitationDto, GuestbookDto, RsvpDto } from './dto'
import { JwtAuthGuard, CurrentUser } from '../auth/guards'

// ── Authenticated owner routes ──
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly svc: InvitationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: UpsertInvitationDto) {
    return this.svc.create(user.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@CurrentUser() user: any) {
    return this.svc.findMine(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOwned(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.findOneOwned(id, user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpsertInvitationDto) {
    return this.svc.update(id, user.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.remove(id, user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/rsvps')
  rsvps(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.listRsvps(id, user.id)
  }
}

// ── Public routes (no auth) ──
@Controller('public/invitations')
export class PublicInvitationsController {
  constructor(private readonly svc: InvitationsService) {}

  @Get(':slug')
  view(@Param('slug') slug: string) {
    return this.svc.viewBySlug(slug)
  }

  @Get(':slug/guestbook')
  listGuestbook(@Param('slug') slug: string) {
    return this.svc.listGuestbook(slug)
  }

  @Post(':slug/guestbook')
  addGuestbook(@Param('slug') slug: string, @Body() dto: GuestbookDto) {
    return this.svc.addGuestbook(slug, dto)
  }

  @Post(':slug/rsvp')
  addRsvp(@Param('slug') slug: string, @Body() dto: RsvpDto) {
    return this.svc.addRsvp(slug, dto)
  }

  @Post(':slug/reactions')
  addReaction(@Param('slug') slug: string) {
    return this.svc.incrementReaction(slug)
  }
}

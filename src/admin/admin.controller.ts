import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  @Get('stats')
  stats() {
    return this.svc.stats()
  }

  @Get('users')
  users() {
    return this.svc.listUsers()
  }

  @Patch('users/:id/active')
  setActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.svc.setUserActive(id, body.isActive)
  }

  @Get('invitations')
  invitations() {
    return this.svc.listInvitations()
  }
}

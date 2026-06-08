import { Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { InvitationsService } from '../invitations/invitations.service'
import { TemplatesService } from '../templates/templates.service'

@Injectable()
export class AdminService {
  constructor(
    private readonly users: UsersService,
    private readonly invitations: InvitationsService,
    private readonly templates: TemplatesService,
  ) {}

  async stats() {
    const [userCount, invCount, publishedCount, templateCount] = await Promise.all([
      this.users.count(),
      this.invitations.count(),
      this.invitations.countPublished(),
      this.templates.count(),
    ])
    return { userCount, invCount, publishedCount, templateCount }
  }

  listUsers() {
    return this.users.findAll()
  }

  setUserActive(id: string, isActive: boolean) {
    return this.users.setActive(id, isActive)
  }

  listInvitations() {
    return this.invitations.findAllAdmin()
  }
}

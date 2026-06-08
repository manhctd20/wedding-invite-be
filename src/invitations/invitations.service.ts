import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invitation } from './invitation.entity'
import { Guestbook } from './guestbook.entity'
import { Rsvp } from './rsvp.entity'
import { UpsertInvitationDto, GuestbookDto, RsvpDto } from './dto'

function genSlug(): string {
  return Math.random().toString(36).slice(2, 10)
}

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation) private readonly repo: Repository<Invitation>,
    @InjectRepository(Guestbook) private readonly gbRepo: Repository<Guestbook>,
    @InjectRepository(Rsvp) private readonly rsvpRepo: Repository<Rsvp>,
  ) {}

  async create(ownerId: string, dto: UpsertInvitationDto) {
    let slug = genSlug()
    while (await this.repo.findOne({ where: { slug } })) slug = genSlug()
    const inv = this.repo.create({
      slug,
      content: dto.content as any,
      published: dto.published ?? false,
      ownerId,
    })
    return this.repo.save(inv)
  }

  async findMine(ownerId: string) {
    return this.repo.find({ where: { ownerId }, order: { updatedAt: 'DESC' } })
  }

  async findOneOwned(id: string, ownerId: string) {
    const inv = await this.repo.findOne({ where: { id } })
    if (!inv) throw new NotFoundException('Không tìm thấy thiệp')
    if (inv.ownerId !== ownerId) throw new ForbiddenException('Không có quyền')
    return inv
  }

  async update(id: string, ownerId: string, dto: UpsertInvitationDto) {
    const inv = await this.findOneOwned(id, ownerId)
    inv.content = dto.content as any
    if (dto.published !== undefined) inv.published = dto.published
    return this.repo.save(inv)
  }

  async remove(id: string, ownerId: string) {
    const inv = await this.findOneOwned(id, ownerId)
    await this.repo.remove(inv)
    return { success: true }
  }

  // Public view by slug — increments view count
  async viewBySlug(slug: string) {
    const inv = await this.repo.findOne({ where: { slug } })
    if (!inv) throw new NotFoundException('Thiệp không tồn tại')
    await this.repo.increment({ id: inv.id }, 'viewCount', 1)
    return inv
  }

  async getBySlug(slug: string) {
    const inv = await this.repo.findOne({ where: { slug } })
    if (!inv) throw new NotFoundException('Thiệp không tồn tại')
    return inv
  }

  // ── Guestbook ──
  async addGuestbook(slug: string, dto: GuestbookDto) {
    const inv = await this.getBySlug(slug)
    const entry = this.gbRepo.create({ ...dto, invitationId: inv.id })
    return this.gbRepo.save(entry)
  }

  async listGuestbook(slug: string) {
    const inv = await this.getBySlug(slug)
    return this.gbRepo.find({ where: { invitationId: inv.id, approved: true }, order: { createdAt: 'DESC' } })
  }

  // ── Reactions (heart count) ──
  async incrementReaction(slug: string) {
    const inv = await this.getBySlug(slug)
    await this.repo.increment({ id: inv.id }, 'reactionCount', 1)
    const updated = await this.repo.findOne({ where: { id: inv.id } })
    return { count: updated?.reactionCount ?? inv.reactionCount + 1 }
  }

  // ── RSVP ──
  async addRsvp(slug: string, dto: RsvpDto) {
    const inv = await this.getBySlug(slug)
    const r = this.rsvpRepo.create({
      guestName: dto.guestName,
      status: dto.status,
      guestCount: dto.guestCount ?? 1,
      note: dto.note ?? '',
      invitationId: inv.id,
    })
    return this.rsvpRepo.save(r)
  }

  async listRsvps(id: string, ownerId: string) {
    await this.findOneOwned(id, ownerId)
    return this.rsvpRepo.find({ where: { invitationId: id }, order: { createdAt: 'DESC' } })
  }

  // ── Admin stats ──
  count() { return this.repo.count() }
  countPublished() { return this.repo.count({ where: { published: true } }) }
  findAllAdmin() {
    return this.repo.find({ order: { createdAt: 'DESC' }, relations: ['owner'], take: 200 })
  }
}

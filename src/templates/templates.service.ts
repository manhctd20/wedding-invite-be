import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Template } from './template.entity'
import { CreateTemplateDto, UpdateTemplateDto } from './dto'

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template) private readonly repo: Repository<Template>,
  ) {}

  // Public: only active templates, ordered
  listActive() {
    return this.repo.find({ where: { isActive: true }, order: { sortOrder: 'ASC', createdAt: 'ASC' } })
  }

  // Admin: all
  listAll() {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } })
  }

  async create(dto: CreateTemplateDto) {
    const existing = await this.repo.findOne({ where: { slug: dto.slug } })
    if (existing) throw new ConflictException('Slug đã tồn tại')
    const t = this.repo.create({
      slug: dto.slug,
      label: dto.label,
      description: dto.description || '',
      palette: dto.palette || [],
      theme: dto.theme || null,
      isPremium: dto.isPremium ?? false,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    })
    return this.repo.save(t)
  }

  async update(id: string, dto: UpdateTemplateDto) {
    const t = await this.repo.findOne({ where: { id } })
    if (!t) throw new NotFoundException('Không tìm thấy template')
    Object.assign(t, dto)
    return this.repo.save(t)
  }

  async remove(id: string) {
    const t = await this.repo.findOne({ where: { id } })
    if (!t) throw new NotFoundException('Không tìm thấy template')
    await this.repo.remove(t)
    return { success: true }
  }

  count() { return this.repo.count() }

  async ensureSeeded(seed: CreateTemplateDto[]) {
    const n = await this.repo.count()
    if (n > 0) return
    for (const s of seed) {
      await this.repo.save(this.repo.create({
        slug: s.slug, label: s.label, description: s.description || '',
        palette: s.palette || [], isPremium: s.isPremium ?? false,
        isActive: true, sortOrder: s.sortOrder ?? 0,
      }))
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User, UserRole } from './user.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.toLowerCase() } })
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } })
  }

  async create(data: { email: string; passwordHash: string; displayName?: string; role?: UserRole }) {
    const user = this.repo.create({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      displayName: data.displayName || '',
      role: data.role || 'couple',
    })
    return this.repo.save(user)
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } })
  }

  async setActive(id: string, isActive: boolean) {
    const user = await this.findById(id)
    if (!user) throw new NotFoundException('User not found')
    user.isActive = isActive
    return this.repo.save(user)
  }

  count() {
    return this.repo.count()
  }
}

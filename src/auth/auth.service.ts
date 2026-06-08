import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { UsersService } from '../users/users.service'
import { RegisterDto, LoginDto } from './dto'
import { User } from '../users/user.entity'

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  private sign(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role }
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email)
    if (existing) throw new ConflictException('Email đã được sử dụng')
    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      role: 'couple',
    })
    return this.sign(user)
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email)
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng')
    const ok = await bcrypt.compare(dto.password, user.passwordHash)
    if (!ok) throw new UnauthorizedException('Email hoặc mật khẩu không đúng')
    if (!user.isActive) throw new UnauthorizedException('Tài khoản đã bị khóa')
    return this.sign(user)
  }
}

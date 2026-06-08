import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'

export class JwtAuthGuard extends AuthGuard('jwt') {}

export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (!required || required.length === 0) return true
    const { user } = ctx.switchToHttp().getRequest()
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền truy cập')
    }
    return true
  }
}

// Decorator to grab current user in controllers
import { createParamDecorator } from '@nestjs/common'
export const CurrentUser = createParamDecorator((_data, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().user
})

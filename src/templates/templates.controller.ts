import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { TemplatesService } from './templates.service'
import { CreateTemplateDto, UpdateTemplateDto } from './dto'
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards'

// Public list
@Controller('public/templates')
export class PublicTemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  @Get()
  list() {
    return this.svc.listActive()
  }
}

// Admin-only CRUD
@Controller('admin/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminTemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  @Get()
  list() {
    return this.svc.listAll()
  }

  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.svc.create(dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.svc.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}

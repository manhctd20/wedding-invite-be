import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Template } from './template.entity'
import { TemplatesService } from './templates.service'
import { PublicTemplatesController, AdminTemplatesController } from './templates.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Template])],
  providers: [TemplatesService],
  controllers: [PublicTemplatesController, AdminTemplatesController],
  exports: [TemplatesService],
})
export class TemplatesModule {}

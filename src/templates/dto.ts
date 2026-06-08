import { IsString, IsOptional, IsBoolean, IsInt, IsArray, IsObject } from 'class-validator'

export class CreateTemplateDto {
  @IsString()
  slug: string

  @IsString()
  label: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsArray()
  palette?: string[]

  @IsOptional()
  @IsObject()
  theme?: Record<string, any>

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsInt()
  sortOrder?: number
}

export class UpdateTemplateDto {
  @IsOptional() @IsString() label?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsArray() palette?: string[]
  @IsOptional() @IsObject() theme?: Record<string, any>
  @IsOptional() @IsBoolean() isPremium?: boolean
  @IsOptional() @IsBoolean() isActive?: boolean
  @IsOptional() @IsInt() sortOrder?: number
}

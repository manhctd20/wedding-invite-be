import { IsObject, IsOptional, IsString, IsBoolean, IsInt, Min, IsIn } from 'class-validator'

export class UpsertInvitationDto {
  @IsObject()
  content: Record<string, any>

  @IsOptional()
  @IsBoolean()
  published?: boolean
}

export class GuestbookDto {
  @IsString()
  guestName: string

  @IsString()
  message: string
}

export class RsvpDto {
  @IsString()
  guestName: string

  @IsIn(['yes', 'no', 'maybe'])
  status: 'yes' | 'no' | 'maybe'

  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number

  @IsOptional()
  @IsString()
  note?: string
}

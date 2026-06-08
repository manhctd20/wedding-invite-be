import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

// A template is a named visual style. The frontend has hard-coded renderers
// keyed by `slug` (bloom/noir/minimal/velvet); this table lets admins manage
// metadata, ordering, premium flag, and (later) AI-generated theme palettes.
@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  slug: string

  @Column()
  label: string

  @Column({ type: 'text', default: '' })
  description: string

  @Column({ type: 'jsonb', nullable: true })
  theme: Record<string, any> | null

  @Column({ type: 'simple-array', default: '' })
  palette: string[]

  @Column({ default: false })
  isPremium: boolean

  @Column({ default: true })
  isActive: boolean

  @Column({ default: 0 })
  sortOrder: number

  @Column({ default: 0 })
  usageCount: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

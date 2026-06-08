import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Invitation } from '../invitations/invitation.entity'

export type UserRole = 'admin' | 'couple'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  passwordHash: string

  @Column({ default: '' })
  displayName: string

  @Column({ type: 'varchar', default: 'couple' })
  role: UserRole

  @Column({ default: true })
  isActive: boolean

  @OneToMany(() => Invitation, inv => inv.owner)
  invitations: Invitation[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Invitation } from './invitation.entity'

export type RsvpStatus = 'yes' | 'no' | 'maybe'

@Entity('rsvps')
export class Rsvp {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  guestName: string

  @Column({ type: 'varchar', default: 'yes' })
  status: RsvpStatus

  @Column({ default: 1 })
  guestCount: number

  @Column({ type: 'text', default: '' })
  note: string

  @Index()
  @ManyToOne(() => Invitation, inv => inv.rsvps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitationId' })
  invitation: Invitation

  @Column()
  invitationId: string

  @CreateDateColumn()
  createdAt: Date
}

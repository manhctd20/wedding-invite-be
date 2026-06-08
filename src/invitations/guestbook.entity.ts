import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Invitation } from './invitation.entity'

@Entity('guestbook_entries')
export class Guestbook {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  guestName: string

  @Column({ type: 'text' })
  message: string

  @Column({ default: true })
  approved: boolean

  @Index()
  @ManyToOne(() => Invitation, inv => inv.guestbook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitationId' })
  invitation: Invitation

  @Column()
  invitationId: string

  @CreateDateColumn()
  createdAt: Date
}

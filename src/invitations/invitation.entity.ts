import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm'
import { User } from '../users/user.entity'
import { Guestbook } from './guestbook.entity'
import { Rsvp } from './rsvp.entity'

// All the wedding content lives in a flexible jsonb blob — matches the
// frontend InvitationData model so we can evolve fields without migrations.
export interface InvitationContent {
  template: string
  brideFirstName: string
  brideLastName: string
  groomFirstName: string
  groomLastName: string
  weddingDate: string
  weddingTime: string
  venueName: string
  venueAddress: string
  message: string
  rsvpName: string
  rsvpPhone: string
  rsvpDeadline: string
  coverImage: string | null
  galleryImages: string[]
  storyMilestones: any[]
  weddingParty: any[]
  scheduleEvents: any[]
  showCountdown: boolean
  showStory: boolean
  showParty: boolean
  showSchedule: boolean
  showGallery: boolean
  showRsvp: boolean
  accentColor: string
  [key: string]: any
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Short public slug used in /invite/:slug
  @Index({ unique: true })
  @Column({ unique: true })
  slug: string

  @Column({ type: 'jsonb' })
  content: InvitationContent

  @Column({ default: false })
  published: boolean

  @Column({ default: 0 })
  viewCount: number

  @Column({ default: 0 })
  reactionCount: number

  @ManyToOne(() => User, user => user.invitations, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User | null

  @Column({ nullable: true })
  ownerId: string | null

  @OneToMany(() => Guestbook, g => g.invitation)
  guestbook: Guestbook[]

  @OneToMany(() => Rsvp, r => r.invitation)
  rsvps: Rsvp[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

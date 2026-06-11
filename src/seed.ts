import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import { User } from './users/user.entity'
import { Invitation } from './invitations/invitation.entity'
import { Template } from './templates/template.entity'
import { Guestbook } from './invitations/guestbook.entity'
import { Rsvp } from './invitations/rsvp.entity'

dotenv.config()

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT || 5544),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Invitation, Template, Guestbook, Rsvp],
  synchronize: true,
})

const TEMPLATES = [
  { slug: 'bloom',     label: 'Bloom',     description: 'Lãng mạn, tinh tế — tông kem và hồng nhẹ',         palette: ['#FAFAF7', '#C4A882', '#2C2420'], isPremium: false, sortOrder: 1 },
  { slug: 'noir',      label: 'Noir',      description: 'Sang trọng tối — đen và vàng champagne',            palette: ['#0A0A0A', '#C9A84C', '#F0EBE0'], isPremium: true,  sortOrder: 2 },
  { slug: 'minimal',   label: 'Minimal',   description: 'Hiện đại, sạch sẽ — trắng và xám',                  palette: ['#FFFFFF', '#4A4A4A', '#1A1A1A'], isPremium: false, sortOrder: 3 },
  { slug: 'velvet',    label: 'Velvet',    description: 'Huyền bí, lãng mạn — tím đêm và vàng ánh',          palette: ['#100D1A', '#C9924A', '#F0E8DC'], isPremium: true,  sortOrder: 4 },
  { slug: 'heritage',  label: 'Heritage',  description: 'Truyền thống, trang trọng — đỏ đô và vàng đồng',    palette: ['#FAF3E0', '#D4AF37', '#4A1C1C'], isPremium: false, sortOrder: 5 },
  { slug: 'garden',    label: 'Garden',    description: 'Tươi mát, thiên nhiên — xanh rêu và mộc mạc',       palette: ['#F7FCF5', '#6B8E7B', '#1C3B2B'], isPremium: false, sortOrder: 6 },
  { slug: 'cinematic', label: 'Cinematic', description: 'Điện ảnh, hiện đại — đen tuyền, chữ nổi bật',       palette: ['#111111', '#F5F5F5', '#888888'], isPremium: true,  sortOrder: 7 },
  { slug: 'cinelove',  label: 'Cinelove',  description: 'Glass UI mobile-first — bottom sheet hộp quà & lời chúc', palette: ['#1B1422', '#E8B4A0', '#F5E9DC'], isPremium: true,  sortOrder: 8 },
]

async function main() {
  await ds.initialize()
  console.log('🔌 Connected')

  const userRepo = ds.getRepository(User)
  const tplRepo = ds.getRepository(Template)

  // Admin account
  const adminEmail = 'admin@wedding.local'
  let admin = await userRepo.findOne({ where: { email: adminEmail } })
  if (!admin) {
    admin = userRepo.create({
      email: adminEmail,
      passwordHash: await bcrypt.hash('admin123', 10),
      displayName: 'Quản trị viên',
      role: 'admin',
    })
    await userRepo.save(admin)
    console.log(`✅ Admin created: ${adminEmail} / admin123`)
  } else {
    console.log('ℹ️  Admin already exists')
  }

  // Demo couple account
  const coupleEmail = 'couple@wedding.local'
  let couple = await userRepo.findOne({ where: { email: coupleEmail } })
  if (!couple) {
    couple = userRepo.create({
      email: coupleEmail,
      passwordHash: await bcrypt.hash('couple123', 10),
      displayName: 'Ngọc Linh & Minh Tuấn',
      role: 'couple',
    })
    await userRepo.save(couple)
    console.log(`✅ Demo couple created: ${coupleEmail} / couple123`)
  }

  // Templates — upsert: thêm mới nếu chưa có, bỏ qua nếu đã có
  let seeded = 0
  for (const t of TEMPLATES) {
    const existing = await tplRepo.findOne({ where: { slug: t.slug } })
    if (!existing) {
      await tplRepo.save(tplRepo.create({ ...t, isActive: true, theme: null }))
      console.log(`✅ Template added: ${t.slug}`)
      seeded++
    }
  }
  if (seeded === 0) {
    console.log('ℹ️  All templates already seeded')
  } else {
    console.log(`✅ Seeded ${seeded} new template(s)`)
  }

  await ds.destroy()
  console.log('🌱 Seed done')
}

main().catch(err => { console.error(err); process.exit(1) })

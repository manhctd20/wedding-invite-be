# Deploy Wedding Invite lên WSL (giả lập server thật) bằng Docker

Mục tiêu: dựng WSL trên Windows như một "server Linux", kéo code từ GitHub, rồi
chạy toàn bộ hệ thống bằng Docker Compose — y hệt quy trình deploy lên VPS/Cloud.

Kiến trúc chạy 3 container, **1 cổng duy nhất** (không lo CORS):

```
                    http://localhost  (cổng 80)
                            │
                    ┌───────▼────────┐
   trình duyệt ───► │  web (nginx)   │  serve FE tĩnh + proxy /api
                    └───────┬────────┘
                            │ /api  →
                    ┌───────▼────────┐
                    │ backend :4000  │  NestJS
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │ postgres :5432 │  volume wedding_pgdata (bền dữ liệu)
                    └────────────────┘
```

---

## 0. Chuẩn bị WSL + Docker (chỉ làm 1 lần)

Mở **PowerShell (Admin)** trên Windows:

```powershell
wsl --install -d Ubuntu
```

Khởi động lại máy nếu được yêu cầu. Sau đó vào Ubuntu **thẳng từ terminal**
(không cần mở "app Ubuntu" — nó chỉ là shortcut của lệnh này):

```powershell
wsl -d Ubuntu      # hoặc gọn: wsl  (Ubuntu là distro mặc định)
```

Lần chạy đầu tiên sẽ hỏi tạo **username/password Linux** ngay trong terminal.
Vài lệnh hay dùng: `exit` (thoát về Windows), `wsl -l -v` (liệt kê distro),
`wsl -d Ubuntu -- <lệnh>` (chạy 1 lệnh rồi trả về).

### Cài Docker bên trong WSL

Có 2 cách, chọn 1:

**Cách A — Docker Desktop (dễ nhất):** cài Docker Desktop trên Windows →
Settings → Resources → WSL Integration → bật cho distro Ubuntu. Xong, trong
Ubuntu gõ `docker` là chạy.

**Cách B — cài Docker Engine thẳng trong Ubuntu (giống server thật nhất):**

```bash
# Trong terminal Ubuntu
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Cho phép chạy docker không cần sudo
sudo usermod -aG docker $USER
# Đóng và mở lại terminal Ubuntu để nhóm 'docker' có hiệu lực

# WSL không có systemd mặc định trên bản cũ → khởi động daemon:
sudo service docker start     # nếu 'systemctl' báo lỗi thì dùng dòng này
```

Kiểm tra:
```bash
docker --version
docker compose version
docker run --rm hello-world
```

> **Lưu ý quan trọng:** làm việc **trong filesystem của Linux** (`~/apps`),
> KHÔNG clone vào `/mnt/e/...`. Build Docker trên `/mnt/*` (ổ Windows) rất chậm
> và hay lỗi quyền file.

---

## 1. Kéo code từ GitHub (2 repo, đặt CẠNH NHAU)

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/manhctd20/wedding-invite.git
git clone https://github.com/manhctd20/wedding-invite-be.git

# Kết quả bắt buộc:
#   ~/apps/wedding-invite/       (FE)
#   ~/apps/wedding-invite-be/    (BE + file compose)
```

> Compose dùng build context `../wedding-invite` nên 2 thư mục **phải nằm cạnh
> nhau** đúng như trên.

---

## 2. Cấu hình biến môi trường

```bash
cd ~/apps/wedding-invite-be
cp .env.example .env
nano .env        # đổi DB_PASSWORD và JWT_SECRET thành chuỗi bí mật thật
```

Nội dung `.env` (giải thích trong file `.env.example`):

| Biến | Ý nghĩa |
|---|---|
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Thông tin Postgres |
| `JWT_SECRET` | Khóa ký JWT — **phải đổi** |
| `CORS_ORIGIN` | Host truy cập, vd `http://localhost` hoặc `http://<IP-server>` |
| `WEB_PORT` | Cổng nginx mở ra ngoài (mặc định `80`; đổi `8080` nếu 80 bận) |

---

## 3. Build & chạy

```bash
cd ~/apps/wedding-invite-be
docker compose -f docker-compose.prod.yml up -d --build
```

Lần đầu build hơi lâu (tải image + npm ci). Xem tiến trình:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Backend có `synchronize: true` → **tự tạo toàn bộ bảng** khi khởi động, không
cần chạy migration thủ công.

---

## 4. Seed dữ liệu ban đầu (tài khoản admin + templates)

Chạy 1 lần sau khi container backend đã "up" (script idempotent, chạy lại không lỗi):

```bash
docker compose -f docker-compose.prod.yml exec backend node dist/seed.js
```

Kết quả tạo:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@wedding.local` | `admin123` |
| Couple | `couple@wedding.local` | `couple123` |

+ 8 template mặc định (bloom, noir, minimal, velvet, heritage, garden, cinematic, cinelove).

> **Đổi mật khẩu seed** trước khi coi là "production": sửa `src/seed.ts` hoặc
> đổi qua giao diện admin.

---

## 5. Kiểm tra

```bash
# API sống chưa
curl http://localhost/api/public/templates
# → [{"slug":"bloom",...}, ...]
```

Trên **trình duyệt Windows**, mở: <http://localhost>
- Trang chủ FE hiện lên
- Admin: <http://localhost/admin> (đăng nhập admin ở trên)

> Truy cập từ máy khác trong LAN: lấy IP của WSL bằng `hostname -I`, rồi mở
> `http://<IP>`. Windows 11 thường tự forward `localhost` sang WSL; nếu máy khác
> không vào được, xem mục *Cổng & mạng* bên dưới.

---

## 6. Quy trình cập nhật (deploy phiên bản mới)

Đúng như trên server thật — pull code rồi build lại:

```bash
cd ~/apps/wedding-invite     && git pull
cd ~/apps/wedding-invite-be  && git pull

# Build lại image có thay đổi và thay container, giữ nguyên DB
docker compose -f docker-compose.prod.yml up -d --build

# (chỉ khi seed.ts đổi) chạy lại seed:
# docker compose -f docker-compose.prod.yml exec backend node dist/seed.js
```

Dữ liệu Postgres nằm trong volume `wedding_pgdata` → **không mất** khi rebuild.

---

## 7. Lệnh vận hành hay dùng

```bash
# Tắt (giữ dữ liệu)
docker compose -f docker-compose.prod.yml down

# Tắt + XÓA dữ liệu DB (reset sạch)
docker compose -f docker-compose.prod.yml down -v

# Xem log từng service
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f backend

# Vào shell container
docker compose -f docker-compose.prod.yml exec backend sh

# Backup DB ra file trên WSL
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U wedding wedding_invite > ~/backup_$(date +%F).sql

# Restore
cat ~/backup_2026-07-01.sql | docker compose -f docker-compose.prod.yml \
  exec -T postgres psql -U wedding -d wedding_invite
```

---

## 8. Cổng & mạng (nếu máy khác trong LAN không vào được)

Windows đôi khi không tự forward cổng WSL ra LAN. Mở **PowerShell (Admin)**:

```powershell
# Lấy IP WSL
wsl hostname -I           # ví dụ 172.23.x.x

# Forward cổng 80 của Windows -> WSL
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=<IP-WSL>

# Mở firewall
netsh advfirewall firewall add rule name="WSL web 80" dir=in action=allow protocol=TCP localport=80
```

Giờ máy khác trong mạng mở `http://<IP-máy-Windows>` là vào được.

---

## 9. Sự cố thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `Cannot connect to the Docker daemon` | Chạy `sudo service docker start` (WSL) hoặc mở Docker Desktop |
| `bind: address already in use` (cổng 80) | Cổng 80 đang bận → đặt `WEB_PORT=8080` trong `.env`, truy cập `http://localhost:8080` |
| Web mở được nhưng gọi API lỗi 502 | `backend` chưa "up" hoặc DB chưa sẵn sàng → `docker compose ... logs backend` |
| FE gọi sai `localhost:4000` | Đảm bảo build với `VITE_API_URL=/api` (đã set sẵn trong compose). Nếu sửa, `up -d --build` lại |
| Build cực chậm / lỗi quyền | Đang clone trong `/mnt/e/...`. Chuyển về `~/apps` (filesystem Linux) |
| Admin login được nhưng trống template | Chưa chạy seed → làm lại **Bước 4** |

---

## Ghi chú "lên production thật" (khác gì so với giả lập này)

Bản compose này đã sát production, nhưng khi lên VPS/domain thật nên bổ sung:

- **TLS/HTTPS**: đặt thêm Caddy/Traefik hoặc Certbot trước `web`, hoặc dùng
  Cloudflare. Đổi `CORS_ORIGIN` sang `https://ten-mien`.
- **`synchronize: true` → TypeORM migrations**: hiện BE tự đổi schema theo entity
  (tiện dev, rủi ro mất data trên prod). Xem TODO trong `CLAUDE.md` của BE.
- **Secrets**: đừng commit `.env`; dùng secret manager của nền tảng deploy.
- **CI/CD**: có thể thêm GitHub Actions build image → push registry → server chỉ
  `pull` (thay vì build tại chỗ như bước 3).

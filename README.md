# 💍 Nathan & Ana Wedding — Setup Guide

## Struktur File

```
/
├── server.js              ← Backend Express + MongoDB
├── package.json
├── .env.example           ← Copy ini jadi .env
└── public/
    ├── index.html         ← Undangan tamu (online)
    ├── checkin.html       ← Panitia scan QR & check-in
    └── admin-qr-tamu.html ← Admin kelola daftar tamu
```

---

## 🚀 Cara Menjalankan (Local)

### 1. Install Node.js & MongoDB

- **Node.js**: https://nodejs.org (versi 18+)
- **MongoDB**: https://www.mongodb.com/try/download/community (atau pakai Atlas gratis)

### 2. Setup project

```bash
# Install dependencies
npm install

# Buat file .env dari contoh
cp .env.example .env
# Edit .env sesuai kebutuhan (MONGO_URI)
```

### 3. Letakkan file HTML di folder public

```bash
mkdir public
# Pindahkan index.html, checkin.html, admin-qr-tamu.html ke folder public/
```

### 4. Jalankan server

```bash
npm start
# Server berjalan di http://localhost:3000
```

### 5. Buka di browser

| Halaman         | URL                                        |
|-----------------|--------------------------------------------|
| Undangan tamu   | http://localhost:3000/                     |
| Check-in panitia| http://localhost:3000/checkin.html         |
| Admin QR        | http://localhost:3000/admin-qr-tamu.html   |

---

## ☁️ Deploy ke VPS / Cloud (Produksi)

### Opsi A: VPS (DigitalOcean, Vultr, dll.)

```bash
# Di server VPS
git clone <repo-kamu> wedding
cd wedding
npm install
cp .env.example .env
# Edit .env → isi MONGO_URI dengan Atlas URI atau MongoDB lokal

# Jalankan dengan PM2 (agar tetap hidup)
npm install -g pm2
pm2 start server.js --name wedding
pm2 save
pm2 startup
```

### Opsi B: Railway.app (gratis, mudah)

1. Push code ke GitHub
2. Buka https://railway.app → New Project → Deploy from GitHub
3. Tambah plugin MongoDB di Railway
4. Set environment variable `MONGO_URI` dari Railway MongoDB
5. Railway otomatis deploy dan beri URL publik

### Opsi C: Render.com (gratis)

1. Push ke GitHub
2. Buat Web Service di render.com
3. Tambahkan MongoDB Atlas URI di Environment Variables
4. Set `Start Command`: `node server.js`

---

## 🗄️ MongoDB Atlas (Rekomendasi untuk Produksi)

1. Daftar gratis di https://cloud.mongodb.com
2. Buat cluster (pilih M0 Free)
3. Buat database user & password
4. Allow IP: `0.0.0.0/0` (atau IP VPS kamu)
5. Copy connection string → masukkan ke `.env` sebagai `MONGO_URI`

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/nathan_ana_wedding
```

---

## 🔗 Alur Data Lengkap

```
Admin tambah tamu          →  MongoDB: collection guests
  (admin-qr-tamu.html)           ↓
                            QR berisi URL: /?tamu=NamaTamu

Tamu buka link undangan    →  index.html (personalized)
  /?tamu=NamaTamu                ↓
                            Tamu isi RSVP → MongoDB: collection rsvp
                            Tamu dapat QR tiket dengan ticketId unik

Panitia scan QR tiket      →  checkin.html
  (hari H)                       ↓
                            Cek MongoDB rsvp → tandai checkedIn: true
                            Real-time update, semua panitia sinkron
```

---

## 📡 API Endpoints

| Method | Endpoint                          | Fungsi                        |
|--------|-----------------------------------|-------------------------------|
| GET    | /api/guests                       | Semua tamu (admin)            |
| POST   | /api/guests                       | Tambah tamu                   |
| POST   | /api/guests/bulk                  | Tambah banyak tamu            |
| DELETE | /api/guests/:id                   | Hapus tamu                    |
| DELETE | /api/guests                       | Hapus semua tamu              |
| GET    | /api/rsvp                         | Semua data RSVP               |
| POST   | /api/rsvp                         | Submit RSVP baru              |
| PATCH  | /api/rsvp/checkin/:ticketId       | Check-in by ticketId          |
| PATCH  | /api/rsvp/checkin-name            | Check-in by nama              |
| PATCH  | /api/rsvp/undo/:ticketId          | Undo check-in                 |
| DELETE | /api/rsvp/checkins                | Reset semua check-in          |
| GET    | /api/greetings                    | Semua ucapan (greeting wall)  |
| POST   | /api/greetings                    | Kirim ucapan baru             |

---

## ⚙️ URL Website di Admin

Di halaman `admin-qr-tamu.html`, isi kolom **URL Website** dengan URL deployment kamu, misalnya:
- `https://wedding-nathan-ana.railway.app`
- `https://nathan-ana.render.com`
- `https://yourdomain.com`

URL ini akan dipakai sebagai bagian dari link unik setiap tamu:
`https://yourdomain.com/?tamu=NamaTamu`

---

Selamat menikah Nathan & Ana! 💍

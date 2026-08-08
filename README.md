# Jurnal Trading XAUUSD

Aplikasi jurnal trading mandiri (standalone), bisa diakses dari perangkat mana saja (HP, tablet, laptop), dengan sistem **login per user** — setiap orang punya akun dan datanya sendiri, tersimpan di cloud lewat **Supabase**.

## Cara kerja singkat

- **Auth (login/daftar)**: pakai Supabase Authentication (email + password)
- **Data jurnal**: tersimpan di database Supabase, dikunci per user lewat Row Level Security — user A tidak bisa lihat data user B
- **Frontend**: React + Vite, di-deploy ke Vercel supaya punya URL sendiri

---

## Langkah 1 — Buat project Supabase (gratis)

1. Buka https://supabase.com, daftar/login (bisa pakai akun GitHub)
2. Klik **New Project**, isi nama project dan password database (simpan baik-baik, tapi tidak akan dipakai langsung di kode)
3. Tunggu 1-2 menit sampai project selesai di-provision

## Langkah 2 — Ambil API key

1. Di dashboard project, buka **Project Settings > API**
2. Catat dua nilai ini:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **anon public key** (key panjang, aman dipakai di frontend)

## Langkah 3 — Buat tabel database

1. Di dashboard, buka **SQL Editor > New query**
2. Buka file `supabase-setup.sql` yang ada di project ini, copy semua isinya
3. Paste ke SQL Editor, klik **Run**
4. Ini akan membuat tabel `storage_kv` + aturan keamanan (Row Level Security) supaya data tiap user terpisah otomatis

## Langkah 4 — Atur konfirmasi email (opsional, untuk testing lebih cepat)

Secara default, Supabase mengirim email konfirmasi saat user daftar. Untuk testing cepat tanpa perlu cek email:

1. Buka **Authentication > Providers > Email**
2. Matikan **"Confirm email"**

(Untuk aplikasi produksi/publik, sebaiknya biarkan aktif demi keamanan.)

## Langkah 5 — Isi kredensial di project

1. Copy file `.env.example` jadi `.env`
2. Isi dengan Project URL dan anon key dari Langkah 2:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=key-panjang-kamu
   ```

## Langkah 6 — Coba jalankan di komputer/laptop dulu (opsional)

Butuh [Node.js](https://nodejs.org) versi 18+.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` — coba daftar akun, login, isi jurnal.

---

## Langkah 7 — Deploy supaya bisa diakses dari semua perangkat

1. **Upload project ke GitHub**
   - Buat repository baru, misal `jurnal-xauusd`
   - Upload semua file project ini (file `.env` **jangan** ikut di-upload — sudah otomatis diabaikan lewat `.gitignore`)

2. **Deploy ke Vercel**
   - Buka https://vercel.com, login pakai akun GitHub
   - **Add New Project** → pilih repository `jurnal-xauusd`
   - Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan:
     - `VITE_SUPABASE_URL` → isi dengan Project URL kamu
     - `VITE_SUPABASE_ANON_KEY` → isi dengan anon key kamu
   - Klik **Deploy**

3. **Selesai** — Vercel kasih URL seperti `jurnal-xauusd.vercel.app`. Buka dari tablet, HP, atau laptop mana saja, tiap orang tinggal daftar akun sendiri untuk mulai pakai.

   Di tablet/HP, buka URL tersebut di browser lalu pilih **"Add to Home Screen"** biar terasa seperti aplikasi asli.

---

## Struktur project

```
jurnal-xauusd/
├── index.html
├── package.json
├── vite.config.js
├── supabase-setup.sql     (jalankan sekali di Supabase SQL Editor)
├── .env.example            (contoh format file .env)
└── src/
    ├── main.jsx             (entry point)
    ├── App.jsx              (cek status login, tampilkan Auth atau Jurnal)
    ├── Auth.jsx             (halaman login/daftar akun)
    ├── supabaseClient.js    (koneksi ke Supabase)
    ├── storageShim.js       (window.storage → dipetakan ke tabel Supabase)
    └── TradingJournal.jsx   (komponen utama jurnal trading)
```

## Catatan keamanan & biaya

- Tier gratis Supabase cukup untuk pemakaian pribadi/kelompok kecil (500MB database, 50.000 monthly active users)
- Data terisolasi otomatis per user lewat Row Level Security — tidak perlu kode tambahan untuk itu
- Kalau nanti butuh fitur tambahan (reset password, login Google, dsb), tinggal aktifkan di **Authentication > Providers** di dashboard Supabase

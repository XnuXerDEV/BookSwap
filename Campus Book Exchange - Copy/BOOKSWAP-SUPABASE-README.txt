BOOKSWAP CAMPUS - PATCH SUPABASE

Isi paket:
- .env: koneksi frontend ke proyek Supabase BookSwap Campus.
- src/lib/books.ts: perbaikan agar buku yang diunggah menggunakan ID pengguna Supabase Auth yang sebenarnya, sesuai kebijakan keamanan database (RLS).
- supabase-schema.sql: skema dan kebijakan keamanan database yang digunakan.

CARA MEMASANG
1. Tutup server Vite (Ctrl+C di terminal).
2. Ekstrak isi ZIP ini ke folder proyek bagian DALAM yang memiliki package.json.
   Pilih Replace/Timpa jika Windows menanyakan file yang sama.
3. Pastikan file .env berada sejajar dengan package.json, bukan di dalam src.
4. Buka terminal di folder tersebut dan jalankan: npm run dev
5. Buka alamat yang ditampilkan Vite (konfigurasi proyek saat ini menggunakan port 3000).
6. Etalase mengambil data langsung dari Supabase; 20 buku contoh sudah dimasukkan ke database cloud.

CATATAN
- Jangan membagikan file .env ke publik atau mengunggahnya ke GitHub.
- VITE_SUPABASE_ANON_KEY adalah kunci publik untuk frontend; keamanan data tetap dijaga dengan RLS.
- Akun yang ingin mengunggah buku harus terdaftar dan login melalui Supabase Auth.
- Sampul buku contoh menggunakan ilustrasi sampul bawaan aplikasi; foto buku asli dapat ditambahkan melalui fitur unggah buku.

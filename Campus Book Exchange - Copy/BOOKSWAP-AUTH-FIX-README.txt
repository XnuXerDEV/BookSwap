BOOKSWAP CAMPUS — PERBAIKAN LOGIN DAN UNGGAH BUKU

PENYEBAB YANG DITEMUKAN
Aplikasi sebelumnya menyimpan tampilan login di localStorage sendiri, sedangkan Supabase RLS membutuhkan sesi Supabase Auth yang benar-benar aktif. Akibatnya header bisa menunjukkan pengguna sudah login, tetapi insert buku tidak mendapatkan auth.uid().
Selain itu, foto pratinjau menggunakan URL blob lokal yang tidak permanen jika disimpan langsung ke database.

ISI PATCH
- src/lib/auth.ts: Supabase Auth menjadi sumber status login; sinkronisasi sesi saat aplikasi dibuka; pendaftaran tidak lagi menganggap akun terautentikasi bila Supabase belum memberikan session; profil dibuat/diperbarui dari akun Auth.
- src/components/bookswap/shell.tsx: memulihkan sesi Supabase ketika aplikasi dimuat dan mengikuti perubahan status login/logout.
- src/components/bookswap/google-auth-modal.tsx: menghapus pemilih akun Google palsu dan menggunakan OAuth Supabase yang sesungguhnya.
- src/lib/books.ts: mengambil auth.uid() dari sesi aktif, mengunggah foto ke Supabase Storage, lalu menyimpan URL publik foto dan data buku ke tabel books.
- src/components/bookswap/sell-book.tsx: mengirim File foto asli ke fungsi penyimpanan, menampilkan error sebenarnya, dan tidak lagi menampilkan keberhasilan palsu.

CARA MEMASANG
1. Hentikan server Vite dengan Ctrl+C.
2. Ekstrak ZIP patch ini.
3. Salin folder src dari patch ke folder proyek bagian dalam yang memiliki package.json. Izinkan Replace/Timpa.
4. JANGAN timpa atau hapus file .env milikmu.
5. Pastikan file .env masih memiliki VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY yang sudah digunakan untuk menampilkan etalase.
6. Jalankan npm run dev dan buka alamat yang ditampilkan.
7. Keluar dari akun BookSwap, kemudian masuk lagi menggunakan email/password yang sama. Ini membersihkan status login lama yang hanya tersimpan di localStorage dan memastikan sesi Supabase dibuat.
8. Coba unggah satu buku dengan foto JPG/PNG/WebP maksimal 5 MB.

SUPABASE STORAGE
Bucket publik bernama book-covers telah dibuat di proyek Supabase BookSwap Campus. Kebijakan Storage membolehkan semua orang melihat foto sampul, tetapi hanya pengguna login yang dapat mengunggah/mengubah/menghapus file di folder dengan ID pengguna mereka sendiri.

CATATAN LOGIN GOOGLE
Tombol Google kini memulai OAuth Supabase asli. Agar berfungsi, provider Google harus diaktifkan dan Client ID/Secret Google dikonfigurasi di Supabase Authentication > Providers > Google, serta URL lokal/produksi didaftarkan di Authentication > URL Configuration. Jika belum dikonfigurasi, gunakan login email/password.

Jika akun email meminta konfirmasi email, buka tautan konfirmasi terlebih dahulu, lalu masuk kembali. Login visual tanpa sesi Supabase tidak cukup untuk mengunggah karena kebijakan keamanan database.

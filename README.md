# Cyber Safety Quest v1.0

Game edukasi keamanan digital untuk remaja usia 13–16 tahun. Pemain menjadi Cyber Hero dan menyelesaikan 20 kasus investigasi tentang identitas digital, kata sandi, phishing, jejak digital, dan keamanan perangkat/jaringan.

## Menjalankan aplikasi

1. Ekstrak folder `Cyber_Safety_Quest_v1.0`.
2. Buka folder menggunakan Visual Studio Code.
3. Jalankan `index.html` dengan Live Server.
4. Masukkan nama dan usia 13–16 tahun.
5. Pilih kasus dari Case Files. Kasus berikutnya terbuka setelah kasus sebelumnya selesai atau ditinjau.

Aplikasi berjalan di browser tanpa backend, database, instalasi Python, atau API key. Font dan ikon menggunakan CDN Google Fonts dan Font Awesome; aplikasi tetap memiliki fallback font sistem jika koneksi tidak tersedia.

## Fitur

- Profil berdasarkan kombinasi nama dan usia, disimpan di `localStorage`.
- Saat login kembali, pemain selalu masuk ke Detective HQ dan memilih kasus sendiri.
- 20 investigasi dalam lima zona, masing-masing empat kasus.
- Progress per kasus, skor, streak, status solved/reviewed, dan pemulihan percobaan.
- Tiga percobaan untuk setiap pertanyaan; salah tiga kali memicu penalti maksimal 20 poin dan membuka penjelasan.
- Kasus yang ditinjau tetap bisa dibuka ulang untuk mencoba kembali.
- Filter zona, dark/light mode, desain responsif, dan dukungan reduced motion.

## Struktur folder

```text
Cyber_Safety_Quest_v1.0/
├── index.html
├── README.md
├── PANDUAN_MISI.md
└── assets/
    ├── css/style.css
    ├── js/app.js
    ├── js/missions.js
    └── images/
        ├── logo.svg
        └── favicon.svg
```

## Sistem skor

- Jawaban benar percobaan 1: 100 poin.
- Jawaban benar percobaan 2: 70 poin.
- Jawaban benar percobaan 3: 40 poin.
- Bonus streak: 25 poin setiap tiga jawaban benar beruntun pada percobaan pertama.
- Tiga jawaban salah dalam satu kasus mengurangi maksimal 20 poin. Skor tidak negatif.
- Kasus yang sudah solved tidak memberikan poin penyelesaian kedua kali.
- Kasus yang reviewed dapat dikerjakan ulang; penalti sebelumnya tetap tercatat pada total skor pemain.

## Penyimpanan dan privasi

Data profil disimpan lokal menggunakan `localStorage` pada browser/perangkat yang sama. Tidak ada sinkronisasi ant perangkat. Menghapus data situs/browser dapat menghapus progres. Untuk proyek kelas yang dipakai bersama di satu perangkat, pemain sebaiknya menggunakan nama dan usia konsisten.

## Catatan pembelajaran

Skenario adalah simulasi pembelajaran dan bukan pengganti arahan orang tua, guru, atau kebijakan keamanan sekolah. Bila mengalami ancaman atau perundungan nyata, siswa sebaiknya menyimpan bukti dengan aman dan meminta bantuan orang dewasa tepercaya.

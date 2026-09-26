# Komsos SMTB Studio

Website profil dan layanan digital Komunikasi Sosial (Komsos) Paroki Santa Maria Tak Bercela, Ngagel Madya No. 1, Surabaya. Sistem ini dirancang sebagai media informasi dan pewartaan digital paroki, portofolio karya, pusat materi e-katekese, serta prototipe toko rohani.

## Profil Komsos

Komsos adalah pelayanan komunikasi sosial Gereja yang membantu menyampaikan informasi, pewartaan, dan kegiatan paroki melalui media. Website Komsos SMTB menjadi titik temu digital bagi umat dan masyarakat untuk mengenal karya media paroki, mengakses materi katekese, melihat produk rohani, serta menghubungi atau mengajukan peliputan kepada tim.

Informasi profil yang ditampilkan:

- **Nama pelayanan:** Komsos Paroki Santa Maria Tak Bercela (SMTB).
- **Alamat paroki:** Jl. Ngagel Madya No. 1, Surabaya.
- **Fokus pelayanan:** dokumentasi dan siaran kegiatan liturgi, publikasi informasi paroki, produksi konten kreatif, dan penyebaran materi katekese digital.
- **Sasaran:** umat paroki dan masyarakat yang ingin mengikuti informasi serta kegiatan pewartaan digital.

## Fungsi Website

| Bagian | Fungsi |
| --- | --- |
| Beranda | Memperkenalkan pelayanan Komsos, menampilkan sorotan karya, dan mengarahkan pengunjung ke portofolio atau formulir peliputan. |
| Portofolio | Menampilkan karya yang sudah dipublikasikan, seperti video, desain visual, artikel, dan audio/podcast. |
| E-Katekese | Menjadi katalog materi dan sumber pembinaan iman digital. Tombol unduh yang tersedia saat ini masih berupa simulasi. |
| Toko Rohani | Menampilkan produk fisik dan digital yang dikelola melalui katalog produk. |
| Keranjang dan checkout | Mengumpulkan produk pilihan, menghitung subtotal, memeriksa kode promo, dan membuat pesanan. |
| Kontak dan gabung tim | Menjadi jalur bagi pengunjung untuk menghubungi Komsos, bergabung sebagai kontributor, atau mengajukan peliputan kegiatan. |
| API dan database | Menyediakan data konten, produk, promo, pesanan, serta token unduhan untuk halaman website. |

## Alur Kerja

### Alur pengunjung

1. Pengunjung membuka website dan mengenal profil serta pelayanan Komsos melalui beranda.
2. Pengunjung menjelajahi portofolio atau materi e-katekese. Konten portofolio yang dikirim API hanya mencakup status `Published`.
3. Untuk belanja, pengunjung memilih produk dan memasukkannya ke keranjang.
4. Kode promo dapat diperiksa berdasarkan status, tanggal berlaku, kuota, dan minimum pembelian.
5. Saat checkout, backend membaca ulang harga dan stok dari database, menghitung total, membuat invoice, lalu menyimpan pesanan dan item pesanan.
6. Dalam prototipe saat ini, halaman checkout langsung memanggil endpoint webhook simulasi dengan status `Paid`. Jika pesanan memiliki produk digital, backend membuat token unduhan yang berlaku 48 jam dan mencatat simulasi pesan WhatsApp di log server.

### Alur pengelolaan data

Konten tim, artikel, produk, dan promo disimpan dalam database MySQL. Frontend mengambil konten melalui REST API, sementara perubahan atau penambahan data untuk prototipe dilakukan langsung di database. Tabel pengguna dan peran sudah tersedia sebagai struktur awal, tetapi halaman login dan dashboard CMS belum diimplementasikan.

## Database

Database bawaan bernama `komsos_smtb_db`, menggunakan MySQL/MariaDB dan port default `3307`. Skema lengkap tersedia di [`kocimos/schema.sql`](kocimos/schema.sql), sedangkan contoh data awal tersedia di [`kocimos/seed.sql`](kocimos/seed.sql).

| Tabel | Fungsi dan hubungan |
| --- | --- |
| `komsos_users` | Data anggota/tim dan peran konten (`Admin`, `Writer`, `Designer`, `Videographer`). Menjadi referensi penulis di `komsos_contents`. Autentikasi belum tersedia. |
| `komsos_contents` | Menyimpan judul, slug, kategori, deskripsi, tautan/file, penulis, status publikasi, dan tanggal publikasi untuk portofolio serta materi katekese. |
| `store_products` | Katalog produk fisik dan digital, harga, stok, berat, gambar, dan lokasi file digital. |
| `store_promos` | Aturan promo: jenis dan nilai potongan, minimum belanja, kuota, periode, dan status. |
| `store_orders` | Ringkasan transaksi, data pembeli, invoice, total, ongkos kirim, status pembayaran/pengiriman, dan promo yang digunakan. |
| `store_order_items` | Rincian produk, kuantitas, dan harga satuan per pesanan. Terhubung ke `store_orders` dan `store_products`. |
| `store_download_tokens` | Token unduhan produk digital, batas dan jumlah unduhan, serta waktu kedaluwarsa. Terhubung ke pesanan dan produk. |

Relasi utama: satu anggota tim dapat menulis banyak konten; satu pesanan dapat memiliki banyak item; tiap item mengacu pada satu produk; pesanan dapat memakai satu promo; token unduhan terkait dengan pesanan dan produk digital.

## API

Base URL lokal: `http://localhost:5000/api/v1`.

| Method dan endpoint | Fungsi |
| --- | --- |
| `GET /contents?kategori={kategori}` | Mengambil konten yang telah dipublikasikan; kategori bersifat opsional. |
| `GET /products?tipe={Fisik\|Digital}` | Mengambil katalog produk; filter tipe bersifat opsional. |
| `GET /products/{slug}` | Mengambil detail satu produk berdasarkan slug. |
| `POST /cart/check-promo` | Memeriksa promo dan menghitung nilai potongan. Body: `{"kode_promo":"KOMSOSBERKAH","subtotal":75000}`. |
| `POST /checkout` | Memvalidasi item, menghitung harga, mengurangi stok produk fisik, dan membuat pesanan. |
| `POST /payment/webhook` | Memperbarui status pembayaran dan membuat token untuk produk digital jika status `Paid`. Saat ini endpoint menerima simulasi, belum memverifikasi signature Midtrans. |
| `GET /download/{token}` | Memeriksa masa berlaku dan batas unduhan token digital. Implementasi saat ini mengembalikan informasi/path file dalam JSON, belum mengirim file secara langsung. |

## Kebutuhan Sistem

### Untuk menjalankan aplikasi

- Node.js 18 atau lebih baru dan npm.
- MySQL 8 atau MariaDB yang mendukung InnoDB; port default `3307`.
- Browser modern dengan JavaScript aktif untuk menggunakan website.
- Koneksi internet jika ingin memuat Tailwind CSS dan Google Fonts dari CDN.
- Spesifikasi komputer tidak dibatasi secara ketat untuk pengembangan lokal; kapasitas disk harus mencukupi untuk database dan berkas media.

### Konfigurasi

Buat file `.env` di dalam direktori `kocimos` dengan konfigurasi database dan server berikut, lalu sesuaikan kredensial dengan lingkungan lokal:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=komsos_smtb_db
APP_BASE_URL=http://localhost:5000
```

Jangan menyimpan kredensial produksi di repository. Gunakan kata sandi database yang kuat dan konfigurasi rahasia yang hanya tersedia di server.

### Menjalankan secara lokal

Dari direktori repository:

```bash
cd kocimos
npm install
```

Buat database dan tabel dengan menjalankan `schema.sql`, kemudian muat data contoh bila diperlukan dengan `seed.sql`. Setelah MySQL siap dan `.env` terisi, jalankan server:

```bash
npm run dev
```

Website tersedia di `http://localhost:5000` dan pemeriksaan server di `http://localhost:5000/health`. Untuk menjalankan tanpa mode watch gunakan `npm start`.

## Status dan Catatan Pengembangan

Fungsi katalog konten/produk, validasi promo, pembuatan pesanan, webhook simulasi, dan pembuatan token unduhan tersedia pada backend. Integrasi pembayaran Midtrans sungguhan, gateway WhatsApp/email, autentikasi dan dashboard CMS, formulir kontak yang tersimpan, serta pengiriman berkas unduhan secara langsung masih memerlukan implementasi dan pengujian sebelum digunakan dalam operasional publik.

Dokumen rincian pengembangan:

- [`kocimos/kocimos_spec.md`](kocimos/kocimos_spec.md)
- [`kocimos/UI_design.md`](kocimos/UI_design.md)
- [`kocimos/decomposition_tugas.md/checkout-api.md`](kocimos/decomposition_tugas.md/checkout-api.md)
- [`kocimos/decomposition_tugas.md/database-schema.md`](kocimos/decomposition_tugas.md/database-schema.md)
- [`kocimos/decomposition_tugas.md/digital-automation.md`](kocimos/decomposition_tugas.md/digital-automation.md)
- [`kocimos/decomposition_tugas.md/promo-feature.md`](kocimos/decomposition_tugas.md/promo-feature.md)
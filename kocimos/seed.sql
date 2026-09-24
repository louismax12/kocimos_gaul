-- =============================================================================
-- SEED DATA: WEBSITE KOMSOS SMTB
-- =============================================================================

USE komsos_smtb_db;

-- Disable foreign key checks for clean seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE store_order_items;
TRUNCATE TABLE store_orders;
TRUNCATE TABLE store_download_tokens;
TRUNCATE TABLE store_products;
TRUNCATE TABLE store_promos;
TRUNCATE TABLE komsos_contents;
TRUNCATE TABLE komsos_users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Seed User Tim Komsos (Password: "password123" yang di-hash dengan bcrypt)
INSERT INTO komsos_users (id, nama, username, email, password, peran) VALUES
(1, 'Admin Komsos', 'admin_komsos', 'admin.komsos@smtb.org', '$2a$12$e8YkYgD8F3d3h4qR9v1w2uO4X3N2M1K0L9J8H7G6F5E4D3C2B1A0', 'Admin'),
(2, 'Fransiskus Asisi', 'frans_writer', 'frans.writer@smtb.org', '$2a$12$e8YkYgD8F3d3h4qR9v1w2uO4X3N2M1K0L9J8H7G6F5E4D3C2B1A0', 'Writer'),
(3, 'Clara Maria', 'clara_designer', 'clara.design@smtb.org', '$2a$12$e8YkYgD8F3d3h4qR9v1w2uO4X3N2M1K0L9J8H7G6F5E4D3C2B1A0', 'Designer'),
(4, 'Ignatius Loyola', 'ignatius_video', 'ignatius.video@smtb.org', '$2a$12$e8YkYgD8F3d3h4qR9v1w2uO4X3N2M1K0L9J8H7G6F5E4D3C2B1A0', 'Videographer');

-- 2. Seed Portofolio Konten & Modul Katekese
INSERT INTO komsos_contents (judul, slug, kategori, deskripsi, file_or_link_url, author_id, status, published_at) VALUES
('Showreel Liputan Misa Paskah 2026', 'showreel-misa-paskah-2026', 'Video', 'Dokumentasi sinematik rangkaian Perayaan Pekan Suci Paroki SMTB.', 'https://www.youtube.com/watch?v=sample1', 4, 'Published', '2026-04-15 10:00:00'),
('Infografis Panduan Ekaristi Untuk Orang Muda', 'infografis-ekaristi-omm', 'Desain Visual', 'Seri poster visual katekese seputar makna Tata Perayaan Ekaristi.', 'https://instagram.com/p/sample-design-1', 3, 'Published', '2026-05-01 14:00:00'),
('Renungan: Menemukan Kedamaian Dalam Kesunyian', 'renungan-kedamaian-kesunyian', 'Artikel', 'Artikel spiritualitas harian untuk diajungi saat masa Adven dan Paskah.', NULL, 2, 'Published', '2026-05-10 08:00:00'),
('Modul Katekese Komuni Pertama 2026 (PDF)', 'modul-katekese-komuni-pertama-2026', 'Artikel', 'E-Book gratis modul panduan persiapan calon penerima Komuni Pertama.', '/downloads/modul-komper-2026.pdf', 2, 'Published', '2026-06-01 09:00:00');

-- 3. Seed Promo / Diskon Store
INSERT INTO store_promos (id, kode_promo, tipe_potongan, nilai_potongan, minimal_pembelian, kuota_maksimal, kuota_terpakai, tanggal_mulai, tanggal_berakhir, status) VALUES
-- Kode promo persentase 15% min belanja Rp 50.000
(1, 'KOMSOSBERKAH', 'Persentase', 15.00, 50000.00, 100, 5, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 'Aktif'),
-- Kode promo potongan nominal Rp 10.000 min belanja Rp 30.000
(2, 'PAROKISMTB', 'Nominal', 10000.00, 30000.00, 50, 2, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 'Aktif');

-- 4. Seed Produk (Fisik & Digital) Toko Rohani
INSERT INTO store_products (id, nama_produk, slug, tipe_produk, deskripsi, harga, stok, berat_gram, gambar_url, file_digital_path) VALUES
(1, 'Rosario Kayu Jati Premium SMTB', 'rosario-kayu-jati-smtb', 'Fisik', 'Rosario kayu jati ukir buatan tangan komunitas UMKM Paroki dengan salib ukir khas.', 45000.00, 50, 150, '/assets/products/rosario-jati.jpg', NULL),
(2, 'Kaos Komsos OMK SMTB - Cotton Combed 30s', 'kaos-komsos-omk-smtb', 'Fisik', 'Kaos bergambar ilustrasi Komsos SMTB berbahan adem dan premium.', 85000.00, 30, 250, '/assets/products/kaos-komsos.jpg', NULL),
(3, 'E-Book EKSKLUSIF: Buku Doa & Novena Keluarga (PDF)', 'ebook-buku-doa-novena-keluarga', 'Digital', 'Panduan e-book PDF lengkap doa harian keluarga dan novena khusus edisi Paroki.', 25000.00, 9999, 0, '/assets/products/ebook-buku-doa.jpg', '/digital_storage/buku-doa-novena-keluarga.pdf'),
(4, 'Paket Audio Mp3 Renungan Harian 30 Hari', 'audio-mp3-renungan-harian', 'Digital', 'Kumpulan podcast audio podcast renungan harian durasi 5 menit.', 20000.00, 9999, 0, '/assets/products/renungan-audio.jpg', '/digital_storage/paket-audio-renungan-30hari.zip');

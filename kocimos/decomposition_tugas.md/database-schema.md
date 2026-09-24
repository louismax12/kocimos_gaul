# Database Schema - Komsos SMTB Website
Spesifikasi skema relasional database MySQL untuk memisahkan tabel Core Company Profile dengan modul E-Commerce (Etalase, Transaksi, dan Promo). Menggunakan port database 3307.

## 1. Modul Core Company Profile
Tabel-tabel ini menangani konten utama katekese, portofolio, dan manajemen tim internal Komsos SMTB.

```sql
-- Tabel Anggota Tim Komsos
CREATE TABLE komsos_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    peran ENUM('Admin', 'Writer', 'Designer', 'Videographer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Portofolio Konten / Katekese
CREATE TABLE komsos_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    kategori ENUM('Video', 'Desain Visual', 'Artikel', 'Audio/Podcast') NOT NULL,
    deskripsi TEXT,
    file_or_link_url VARCHAR(255), -- Link YouTube / IG / Path File PDF Modul
    author_id INT,
    status ENUM('Draft', 'Published') DEFAULT 'Draft',
    published_at TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES komsos_users(id) ON DELETE SET NULL
);
```

## 2. Modul E-Commerce (Etalase Terpisah)
Tabel-tabel khusus untuk menangani produk toko rohani/merchandise, stok, hingga transaksi logistik.

```sql
-- Tabel Produk (Fisik & Digital)
CREATE TABLE store_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_produk VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    tipe_produk ENUM('Fisik', 'Digital') NOT NULL,
    deskripsi TEXT,
    harga DECIMAL(10,2) NOT NULL,
    stok INT DEFAULT 0,
    berat_gram INT DEFAULT 0,
    gambar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pesanan (Orders)
CREATE TABLE store_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    nama_pembeli VARCHAR(100) NOT NULL,
    whatsapp_pembeli VARCHAR(20) NOT NULL,
    alamat_pengiriman TEXT NULL,
    total_bayar DECIMAL(10,2) NOT NULL,
    ongkos_kirim DECIMAL(10,2) DEFAULT 0,
    status_pembayaran ENUM('Pending', 'Paid', 'Expired', 'Failed') DEFAULT 'Pending',
    status_pengiriman ENUM('Belum Dikirim', 'Dikirim', 'Selesai') DEFAULT 'Belum Dikirim',
    snap_token_midtrans VARCHAR(255) NULL,
    promo_id INT NULL,
    jumlah_potongan DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_id) REFERENCES store_promos(id) ON DELETE SET NULL
);

-- Tabel Detail Item Pesanan (Many-to-Many Bridge)
CREATE TABLE store_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    kuantitas INT NOT NULL,
    harga_satuan DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE RESTRICT
);
```
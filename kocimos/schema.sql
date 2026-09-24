-- =============================================================================
-- DATABASE SCHEMA: WEBSITE KOMSOS SMTB
-- Port: 3307
-- Target DB Engine: MySQL 8.0+ / MariaDB
-- =============================================================================

CREATE DATABASE IF NOT EXISTS komsos_smtb_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE komsos_smtb_db;

-- -----------------------------------------------------------------------------
-- MODUL CORE COMPANY PROFILE
-- -----------------------------------------------------------------------------

-- 1. Tabel Anggota Tim Komsos
CREATE TABLE IF NOT EXISTS komsos_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed password (e.g. bcrypt/argon2)
    peran ENUM('Admin', 'Writer', 'Designer', 'Videographer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabel Portofolio Konten / Katekese
CREATE TABLE IF NOT EXISTS komsos_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    kategori ENUM('Video', 'Desain Visual', 'Artikel', 'Audio/Podcast') NOT NULL,
    deskripsi TEXT,
    file_or_link_url VARCHAR(255), -- Link YouTube / IG / Path File PDF
    author_id INT,
    status ENUM('Draft', 'Published') DEFAULT 'Draft',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES komsos_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- MODUL E-COMMERCE (TOKO ROHANI)
-- -----------------------------------------------------------------------------

-- 3. Tabel Manajemen Diskon / Promo
CREATE TABLE IF NOT EXISTS store_promos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_promo VARCHAR(50) UNIQUE NOT NULL,
    tipe_potongan ENUM('Persentase', 'Nominal') NOT NULL,
    nilai_potongan DECIMAL(10,2) NOT NULL,
    minimal_pembelian DECIMAL(10,2) DEFAULT 0.00,
    kuota_maksimal INT DEFAULT 0,
    kuota_terpakai INT DEFAULT 0,
    tanggal_mulai DATETIME NOT NULL,
    tanggal_berakhir DATETIME NOT NULL,
    status ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabel Produk (Fisik & Digital)
CREATE TABLE IF NOT EXISTS store_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_produk VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    tipe_produk ENUM('Fisik', 'Digital') NOT NULL,
    deskripsi TEXT,
    harga DECIMAL(10,2) NOT NULL,
    stok INT DEFAULT 0,
    berat_gram INT DEFAULT 0,
    gambar_url VARCHAR(255),
    file_digital_path VARCHAR(255) NULL, -- Path file jika tipe_produk = Digital
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Tabel Pesanan (Orders)
CREATE TABLE IF NOT EXISTS store_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    nama_pembeli VARCHAR(100) NOT NULL,
    whatsapp_pembeli VARCHAR(20) NOT NULL,
    alamat_pengiriman TEXT NULL,
    total_bayar DECIMAL(10,2) NOT NULL,
    ongkos_kirim DECIMAL(10,2) DEFAULT 0.00,
    status_pembayaran ENUM('Pending', 'Paid', 'Expired', 'Failed') DEFAULT 'Pending',
    status_pengiriman ENUM('Belum Dikirim', 'Dikirim', 'Selesai') DEFAULT 'Belum Dikirim',
    snap_token_midtrans VARCHAR(255) NULL,
    promo_id INT NULL,
    jumlah_potongan DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_id) REFERENCES store_promos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Tabel Detail Item Pesanan
CREATE TABLE IF NOT EXISTS store_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    kuantitas INT NOT NULL,
    harga_satuan DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. Tabel Secure Digital Download Tokens
CREATE TABLE IF NOT EXISTS store_download_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    max_downloads INT DEFAULT 3,
    download_count INT DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

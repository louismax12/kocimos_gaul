# Dokumentasi Pengembangan Website Komsos SMTB
Dokumentasi ini dirancang khusus untuk memandu AI Agent di **Antigravity IDE** dalam mengimplementasikan website Company Profile & E-Commerce (Toko Rohani) untuk Komsos SMTB.

---

## 1. Konsep Dasar & Struktur Halaman
Website ini berfungsi sebagai portofolio profesional Komsos SMTB yang dikelola dengan pendekatan agensi konten digital kreatif (studio kreatif), sekaligus sebagai pusat etalase e-commerce produk fisik dan digital.

### Struktur Halaman Utama (Sitemap)
*   **Beranda (Home):** Hero section berupa video *showreel* konten terbaik, proyek terbaru, dan statistik jangkauan media.
*   **Tentang Komsos (About Us):** Visi, misi, struktur tim kreatif, dan peranan Komsos dalam pewartaan paroki digital.
*   **Portofolio Konten (Our Work):** Etalase hasil produksi berdasarkan format (*Video & Shorts*, *Desain Grafis*, *Artikel*, *Audio/Podcast*).
*   **Hub Katekese (Resources):** Ruang unduhan gratis modul katekese atau bacaan literatur digital.
*   **Kolaborasi / Kontak (Contact Us):** Form peliputan acara lingkungan/wilayah, registrasi kontributor awam, dan kontak resmi.

### Fitur Pendukung Utama
*   **CMS Komponen:** Mempermudah tim memperbarui portofolio tanpa mengubah source code utama.
*   **Arsip Multimedia:** Integrasi otomatis umpan media sosial (YouTube/Instagram) secara real-time.
*   **Pusat Unduhan (Digital Asset Center):** Halaman terstruktur untuk mengunduh modul PDF katekese secara aman.

---

## 2. Arsitektur Database (MySQL - Port 3307)
Arsitektur database dipisahkan secara modular antara *Core Company Profile* dan *Modul E-Commerce (Etalase)* untuk menjaga performa query.

```sql
-- =============================================================================
-- MODUL CORE COMPANY PROFILE
-- =============================================================================

-- 1. Tabel Anggota Tim Komsos
CREATE TABLE komsos_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    peran ENUM('Admin', 'Writer', 'Designer', 'Videographer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Portofolio Konten / Katekese
CREATE TABLE komsos_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    kategori ENUM('Video', 'Desain Visual', 'Artikel', 'Audio/Podcast') NOT NULL,
    deskripsi TEXT,
    file_or_link_url VARCHAR(255), -- Link YouTube / IG / Path File PDF
    author_id INT,
    status ENUM('Draft', 'Published') DEFAULT 'Draft',
    published_at TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES komsos_users(id) ON DELETE SET NULL
);

-- =============================================================================
-- MODUL E-COMMERCE (ETALASE TERPISAH)
-- =============================================================================

-- 3. Tabel Manajemen Diskon / Promo
CREATE TABLE store_promos (
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
);

-- 4. Tabel Produk (Fisik & Digital)
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

-- 5. Tabel Pesanan (Orders)
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

-- 6. Tabel Detail Item Pesanan (Many-to-Many Bridge)
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

---

## 3. Desain Arsitektur API (RESTful Endpoints)

| Method | Endpoint | Fungsi | Autentikasi |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/products` | Mengambil seluruh daftar produk | Public |
| **GET** | `/api/v1/products/{slug}` | Mengambil detail spesifik satu produk | Public |
| **POST** | `/api/v1/cart/check-promo` | Memvalidasi validitas kode diskon/promo | Public |
| **POST** | `/api/v1/checkout` | Membuat pesanan baru & membuat snap token Midtrans | Public |
| **POST** | `/api/v1/payment/webhook` | Menerima callback notifikasi otomatis dari Midtrans | Public (Secret Key) |
| **GET** | `/api/v1/download/{token}` | Endpoint aman mengunduh produk katekese digital | Public (Temp Token) |

---

## 4. Alur Otomasi Produk Digital & Validasi Promo

### Logika Sistem Otomasi (Workflow)
1. **Webhook Callback:** Pembeli membayar via QRIS/Transfer -> Midtrans mengirim notifikasi ke `/api/v1/payment/webhook`.
2. **Status Update:** Backend memvalidasi signature -> mengubah status `store_orders.status_pembayaran` menjadi `Paid`.
3. **Trigger Digital Item:** Jika pesanan mengandung produk dengan `tipe_produk = 'Digital'`, backend men-generate *Secure Temporary Token* dengan batas waktu (e.g., 48 jam) atau batas maksimal unduhan.
4. **Notifikasi Otomatis:** Sistem memicu WhatsApp Gateway untuk mengirim pesan link unduhan otomatis: `komsos-smtb.com/api/v1/download/[secure-token]`.

### Tahapan Validasi Kode Promo di Backend
Saat melakukan request ke `/api/v1/cart/check-promo`, jalankan pengecekan berlapis:
1. Pastikan `kode_promo` terdaftar di tabel `store_promos`.
2. Pastikan `status` bernilai `Aktif`.
3. Pastikan waktu saat ini (`NOW()`) berada di range `tanggal_mulai` dan `tanggal_berakhir`.
4. Pastikan `kuota_terpakai < kuota_maksimal`.
5. Pastikan subtotal belanja saat ini memenuhi kriteria `minimal_pembelian`.
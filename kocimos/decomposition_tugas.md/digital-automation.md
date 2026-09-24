# Sistem Otomasi Pengiriman Produk Digital - Komsos SMTB
Spesifikasi alur kerja otonom pasca-pembayaran berhasil untuk mendistribusikan aset digital (Modul Katekese PDF, Desain Visual).

## Skema Database Token Unduhan Aman
```sql
CREATE TABLE secure_downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    secure_token VARCHAR(255) UNIQUE NOT NULL,
    download_count INT DEFAULT 0,
    max_downloads INT DEFAULT 3,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE
);
```

## Alur Kerja Otomasi (Workflow)
1. **Webhook Trigger:** Midtrans mengirim callback pembayaran berhasil ke endpoint `/api/v1/payment/webhook`.
2. **Status Update:** Backend memvalidasi signature lalu mengubah status pesanan di tabel `store_orders` menjadi `Paid`.
3. **Deteksi Tipe Produk:** Sistem memeriksa item belanja di `store_order_items`. Jika item tersebut memiliki `tipe_produk = 'Digital'`, pemicu otomasi diaktifkan.
4. **Token Generation:** Backend membuat token acak unik (Secure Temporary Token), mendefinisikan batas waktu kedaluwarsa (misal: 48 jam), dan menyimpannya ke tabel `secure_downloads`.
5. **Notifikasi Otomatis:** Sistem memicu API WhatsApp Gateway / Email untuk mengirimkan tautan unduhan aman kepada pembeli secara real-time.
   * *Format Endpoint Unduhan:* `/api/v1/download/{secure_token}`
6. **Limit Check:** Saat endpoint unduhan diakses, sistem memeriksa kolom `download_count` dan `expires_at`. Jika valid, file dikirimkan dan `download_count` bertambah 1. Jika tidak valid, akses ditolak (`403 Forbidden`).
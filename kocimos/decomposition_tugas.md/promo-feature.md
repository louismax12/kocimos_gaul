# Manajemen Diskon & Kupon Promo - Komsos SMTB
Spesifikasi skema tabel kebijakan promo beserta logika validasi berlapis pada backend.

## Skema Database
```sql
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
```

## Logika Validasi Berlapis Backend (Business Logic)
Saat user menerapkan kode promo di keranjang atau saat proses checkout, backend wajib melakukan pengecekan urutan berikut:
1. **Eksistensi:** Memastikan `kode_promo` terdaftar di dalam tabel `store_promos`.
2. **Status Keaktifan:** Memastikan kolom `status` bernilai `Aktif`.
3. **Masa Berlaku:** Memastikan waktu saat ini (`NOW()`) berada di antara rentang `tanggal_mulai` dan `tanggal_berakhir`.
4. **Ketersediaan Kuota:** Memastikan `kuota_terpakai` masih lebih kecil dari total `kuota_maksimal`.
5. **Syarat Minimal Belanja:** Memastikan total harga barang dalam keranjang sama dengan atau lebih besar dari `minimal_pembelian`.
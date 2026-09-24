# RESTful API Endpoints - Checkout & Store Komsos SMTB
Spesifikasi routing endpoint backend untuk mengelola transaksi etalase toko rohani dan integrasi dengan payment gateway (Midtrans).

## Daftar Endpoint API

### 1. Ambil Semua Produk
* **Method:** `GET`
* **Endpoint:** `/api/v1/products`
* **Autentikasi:** Public
* **Query Parameters:** `type` (Fisik/Digital), `category`

### 2. Detail Produk Spesifik
* **Method:** `GET`
* **Endpoint:** `/api/v1/products/{slug}`
* **Autentikasi:** Public

### 3. Validasi Kode Promo
* **Method:** `POST`
* **Endpoint:** `/api/v1/cart/check-promo`
* **Autentikasi:** Public
* **Payload:**
```json
{
  "code": "BKSN2026",
  "total_cart_amount": 75000
}
```

### 4. Proses Checkout (Place Order)
* **Method:** `POST`
* **Endpoint:** `/api/v1/checkout`
* **Autentikasi:** Public
* **Payload:** Menyertakan data pembeli, keranjang belanja, alamat (jika barang fisik), dan kode promo (jika ada). Menghasilkan `snap_token_midtrans`.

### 5. Midtrans Payment Webhook
* **Method:** `POST`
* **Endpoint:** `/api/v1/payment/webhook`
* **Autentikasi:** Public (Secret Key Verification)
* **Fungsi:** Menerima callback dari Midtrans untuk mengubah status pesanan menjadi `Paid`, `Expired`, atau `Failed`.
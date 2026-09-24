const crypto = require('crypto');
const db = require('../config/db');

// 1. GET /api/v1/contents (Portofolio & Modul Katekese)
exports.getContents = async (req, res) => {
  try {
    const { kategori } = req.query;
    let sql = `
      SELECT c.*, u.nama AS author_name 
      FROM komsos_contents c 
      LEFT JOIN komsos_users u ON c.author_id = u.id 
      WHERE c.status = 'Published'
    `;
    const params = [];

    if (kategori) {
      sql += ` AND c.kategori = ?`;
      params.push(kategori);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching contents:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data konten.' });
  }
};

// 2. GET /api/v1/products (Katalog Produk Toko Rohani)
exports.getProducts = async (req, res) => {
  try {
    const { tipe } = req.query;
    let sql = `SELECT * FROM store_products WHERE 1=1`;
    const params = [];

    if (tipe) {
      sql += ` AND tipe_produk = ?`;
      params.push(tipe);
    }

    sql += ` ORDER BY created_at DESC`;

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar produk.' });
  }
};

// 3. GET /api/v1/products/:slug (Detail Produk Spesifik)
exports.getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const [rows] = await db.query(`SELECT * FROM store_products WHERE slug = ?`, [slug]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching product by slug:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail produk.' });
  }
};

// 4. POST /api/v1/cart/check-promo (Validasi Diskon/Promo Code 5 Tahap)
exports.checkPromo = async (req, res) => {
  try {
    const { kode_promo, subtotal } = req.body;

    if (!kode_promo || subtotal === undefined) {
      return res.status(400).json({ success: false, message: 'Kode promo dan subtotal belanja wajib diisi.' });
    }

    // Tahap 1: Cek keberadaan kode promo
    const [rows] = await db.query(`SELECT * FROM store_promos WHERE kode_promo = ?`, [kode_promo]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kode promo tidak terdaftar.' });
    }

    const promo = rows[0];

    // Tahap 2: Cek status aktif
    if (promo.status !== 'Aktif') {
      return res.status(400).json({ success: false, message: 'Kode promo sudah tidak aktif.' });
    }

    // Tahap 3: Cek masa berlaku tanggal (NOW() di dalam range tanggal_mulai & tanggal_berakhir)
    const now = new Date();
    const startDate = new Date(promo.tanggal_mulai);
    const endDate = new Date(promo.tanggal_berakhir);

    if (now < startDate || now > endDate) {
      return res.status(400).json({ success: false, message: 'Kode promo berada di luar periode berlaku.' });
    }

    // Tahap 4: Cek kuota pemakaian
    if (promo.kuota_maksimal > 0 && promo.kuota_terpakai >= promo.kuota_maksimal) {
      return res.status(400).json({ success: false, message: 'Kuota pemakaian kode promo telah habis.' });
    }

    // Tahap 5: Cek syarat minimal pembelian
    const subtotalNum = parseFloat(subtotal);
    const minBuy = parseFloat(promo.minimal_pembelian);
    if (subtotalNum < minBuy) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimal pembelian untuk promo ini adalah Rp ${minBuy.toLocaleString('id-ID')}` 
      });
    }

    // Hitung besaran nilai potongan
    let total_potongan = 0;
    const nilaiPotongan = parseFloat(promo.nilai_potongan);

    if (promo.tipe_potongan === 'Persentase') {
      total_potongan = (subtotalNum * nilaiPotongan) / 100;
    } else {
      total_potongan = nilaiPotongan;
    }

    // Potongan tidak boleh melebihi subtotal
    if (total_potongan > subtotalNum) {
      total_potongan = subtotalNum;
    }

    res.json({
      success: true,
      message: 'Kode promo berhasil digunakan!',
      data: {
        promo_id: promo.id,
        kode_promo: promo.kode_promo,
        tipe_potongan: promo.tipe_potongan,
        nilai_potongan: nilaiPotongan,
        total_potongan: total_potongan
      }
    });

  } catch (err) {
    console.error('Error checking promo:', err);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi kode promo.' });
  }
};

// 5. POST /api/v1/checkout (Buat Pesanan & Snap Token Mock/Midtrans)
exports.checkout = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { nama_pembeli, whatsapp_pembeli, alamat_pengiriman, items, promo_id, ongkos_kirim = 0 } = req.body;

    if (!nama_pembeli || !whatsapp_pembeli || !items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Data checkout tidak lengkap.' });
    }

    // Hitung total item & validasi harga
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const [prodRows] = await connection.query(`SELECT * FROM store_products WHERE id = ?`, [item.product_id]);
      if (prodRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Produk ID ${item.product_id} tidak ditemukan.` });
      }

      const product = prodRows[0];
      const qty = parseInt(item.kuantitas, 10);
      const itemHarga = parseFloat(product.harga);

      // Cek stok jika produk fisik
      if (product.tipe_produk === 'Fisik' && product.stok < qty) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Stok produk ${product.nama_produk} tidak mencukupi.` });
      }

      subtotal += itemHarga * qty;
      validatedItems.push({
        product_id: product.id,
        kuantitas: qty,
        harga_satuan: itemHarga,
        tipe_produk: product.tipe_produk
      });
    }

    // Hitung potongan promo jika ada
    let jumlah_potongan = 0;
    let validPromoId = null;

    if (promo_id) {
      const [promoRows] = await connection.query(`SELECT * FROM store_promos WHERE id = ? AND status = 'Aktif'`, [promo_id]);
      if (promoRows.length > 0) {
        const promo = promoRows[0];
        validPromoId = promo.id;
        const nilaiPotongan = parseFloat(promo.nilai_potongan);

        if (promo.tipe_potongan === 'Persentase') {
          jumlah_potongan = (subtotal * nilaiPotongan) / 100;
        } else {
          jumlah_potongan = nilaiPotongan;
        }

        if (jumlah_potongan > subtotal) jumlah_potongan = subtotal;

        // Update kuota terpakai promo
        await connection.query(`UPDATE store_promos SET kuota_terpakai = kuota_terpakai + 1 WHERE id = ?`, [promo.id]);
      }
    }

    const ongkirNum = parseFloat(ongkos_kirim);
    const total_bayar = Math.max(0, subtotal - jumlah_potongan + ongkirNum);
    const invoice_number = `INV-SMTB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mock_snap_token = `SNAP-${crypto.randomBytes(12).toString('hex')}`;

    // Simpan ke tabel store_orders
    const [orderResult] = await connection.query(`
      INSERT INTO store_orders 
      (invoice_number, nama_pembeli, whatsapp_pembeli, alamat_pengiriman, total_bayar, ongkos_kirim, snap_token_midtrans, promo_id, jumlah_potongan, status_pembayaran)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [invoice_number, nama_pembeli, whatsapp_pembeli, alamat_pengiriman || null, total_bayar, ongkirNum, mock_snap_token, validPromoId, jumlah_potongan]);

    const orderId = orderResult.insertId;

    // Simpan ke tabel store_order_items
    for (const item of validatedItems) {
      await connection.query(`
        INSERT INTO store_order_items (order_id, product_id, kuantitas, harga_satuan)
        VALUES (?, ?, ?, ?)
      `, [orderId, item.product_id, item.kuantitas, item.harga_satuan]);

      // Potong stok produk fisik
      if (item.tipe_produk === 'Fisik') {
        await connection.query(`UPDATE store_products SET stok = stok - ? WHERE id = ?`, [item.kuantitas, item.product_id]);
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Pesanan berhasil dibuat.',
      data: {
        order_id: orderId,
        invoice_number: invoice_number,
        total_bayar: total_bayar,
        snap_token: mock_snap_token
      }
    });

  } catch (err) {
    await connection.rollback();
    console.error('Error during checkout:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses checkout pesanan.' });
  } finally {
    connection.release();
  }
};

// 6. POST /api/v1/payment/webhook (Simulasi & Midtrans Webhook Callback)
exports.paymentWebhook = async (req, res) => {
  try {
    const { invoice_number, status_pembayaran } = req.body;

    if (!invoice_number) {
      return res.status(400).json({ success: false, message: 'Invoice number diperlukan.' });
    }

    const [orderRows] = await db.query(`SELECT * FROM store_orders WHERE invoice_number = ?`, [invoice_number]);
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const order = orderRows[0];
    const newStatus = status_pembayaran === 'Paid' ? 'Paid' : (status_pembayaran || 'Paid');

    // Update status pembayaran
    await db.query(`UPDATE store_orders SET status_pembayaran = ? WHERE id = ?`, [newStatus, order.id]);

    const generatedTokens = [];

    // Jika pembayaran sukses ('Paid'), cek apakah ada produk tipe digital
    if (newStatus === 'Paid') {
      const [itemRows] = await db.query(`
        SELECT oi.*, p.tipe_produk, p.nama_produk, p.file_digital_path
        FROM store_order_items oi
        JOIN store_products p ON oi.product_id = p.id
        WHERE oi.order_id = ? AND p.tipe_produk = 'Digital'
      `, [order.id]);

      // Generate Secure Download Token 48 jam
      for (const item of itemRows) {
        const tokenStr = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 jam

        await db.query(`
          INSERT INTO store_download_tokens (token, order_id, product_id, max_downloads, expires_at)
          VALUES (?, ?, ?, 5, ?)
        `, [tokenStr, order.id, item.product_id, expiresAt]);

        const downloadUrl = `${process.env.APP_BASE_URL || 'http://localhost:5000'}/api/v1/download/${tokenStr}`;
        generatedTokens.push({
          product_name: item.nama_produk,
          download_url: downloadUrl,
          expires_at: expiresAt
        });
      }

      // Simulasi pesan WhatsApp Gateway
      console.log(`[WA GATEWAY SIMULATION] Mengirim pesan ke ${order.whatsapp_pembeli}:`);
      console.log(`Halo ${order.nama_pembeli}, Pembayaran invoice ${order.invoice_number} sebesar Rp ${order.total_bayar} BERHASIL!`);
      if (generatedTokens.length > 0) {
        console.log(`Link akses unduhan produk digital Anda:`);
        generatedTokens.forEach(t => console.log(`- ${t.product_name}: ${t.download_url}`));
      }
    }

    res.json({
      success: true,
      message: 'Webhook pembayaran berhasil diproses.',
      data: {
        order_id: order.id,
        invoice_number: order.invoice_number,
        status_pembayaran: newStatus,
        digital_downloads: generatedTokens
      }
    });

  } catch (err) {
    console.error('Error processing payment webhook:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses webhook pembayaran.' });
  }
};

// 7. GET /api/v1/download/:token (Endpoint Aman Unduhan Produk Digital)
exports.downloadDigitalProduct = async (req, res) => {
  try {
    const { token } = req.params;

    const [rows] = await db.query(`
      SELECT dt.*, p.nama_produk, p.file_digital_path 
      FROM store_download_tokens dt
      JOIN store_products p ON dt.product_id = p.id
      WHERE dt.token = ?
    `, [token]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Token unduhan tidak valid.' });
    }

    const tokenData = rows[0];
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    // Cek kadaluarsa token
    if (now > expiresAt) {
      return res.status(410).json({ success: false, message: 'Masa berlaku token unduhan ini telah habis (Expired).' });
    }

    // Cek batas maksimal unduhan
    if (tokenData.download_count >= tokenData.max_downloads) {
      return res.status(429).json({ success: false, message: 'Batas maksimal kuota unduhan telah tercapai.' });
    }

    // Update jumlah unduhan
    await db.query(`UPDATE store_download_tokens SET download_count = download_count + 1 WHERE id = ?`, [tokenData.id]);

    res.json({
      success: true,
      message: 'Akses unduhan valid. Mengirim berkas digital.',
      data: {
        product_name: tokenData.nama_produk,
        file_path: tokenData.file_digital_path,
        remaining_downloads: tokenData.max_downloads - (tokenData.download_count + 1)
      }
    });

  } catch (err) {
    console.error('Error handling digital download:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses unduhan produk digital.' });
  }
};

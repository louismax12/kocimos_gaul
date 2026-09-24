const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// 1. Core Profile & Portofolio Konten
router.get('/contents', apiController.getContents);

// 2. E-Commerce Produk Katalog
router.get('/products', apiController.getProducts);
router.get('/products/:slug', apiController.getProductBySlug);

// 3. Promo Check & Checkout
router.post('/cart/check-promo', apiController.checkPromo);
router.post('/checkout', apiController.checkout);

// 4. Payment Webhook Callback
router.post('/payment/webhook', apiController.paymentWebhook);

// 5. Secure Digital Download Token
router.get('/download/:token', apiController.downloadDigitalProduct);

module.exports = router;

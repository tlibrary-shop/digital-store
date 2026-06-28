const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { createPaymentLink, verifyPayment } = require('../services/payment');

// Create order
router.post('/', verifyToken, async (req, res) => {
  try {
    const { product_id } = req.body;
    const userId = req.user.id;

    // Get product details
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Create order
    const orderId = uuidv4();
    const order = await pool.query(
      `INSERT INTO orders (id, user_id, product_id, amount, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderId, userId, product_id, product.price, 'pending']
    );

    // Generate payment link (Midtrans)
    const paymentLink = await createPaymentLink(orderId, product.price, product.title, {
      user_id: userId,
      product_id: product_id
    });

    res.status(201).json({
      order: order.rows[0],
      payment_link: paymentLink
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user orders
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT o.*, p.title, p.cover_image FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Payment callback (Webhook from Midtrans)
router.post('/callback', async (req, res) => {
  try {
    const { transaction_id, order_id, transaction_status } = req.body;

    // Verify payment with Midtrans
    const isValid = await verifyPayment(transaction_id);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment' });
    }

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      // Update order status
      await pool.query(
        'UPDATE orders SET status = $1, transaction_id = $2, payment_method = $3 WHERE id = $4',
        ['completed', transaction_id, 'midtrans', order_id]
      );

      console.log(`✅ Order ${order_id} payment confirmed`);
    } else if (transaction_status === 'deny' || transaction_status === 'expire') {
      await pool.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['cancelled', order_id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

module.exports = router;

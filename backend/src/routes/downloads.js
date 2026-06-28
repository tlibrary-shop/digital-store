const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const minioClient = require('../config/minio');
const { verifyToken } = require('../middleware/auth');

// Get download link
router.get('/link/:order_id', verifyToken, async (req, res) => {
  try {
    const { order_id } = req.params;
    const userId = req.user.id;

    // Verify order belongs to user and is completed
    const orderResult = await pool.query(
      `SELECT o.*, p.file_key FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.id = $1 AND o.user_id = $2 AND o.status = $3`,
      [order_id, userId, 'completed']
    );

    if (orderResult.rows.length === 0) {
      return res.status(403).json({ error: 'Order not found or not completed' });
    }

    const { file_key } = orderResult.rows[0];

    // Generate presigned URL for file download
    const presignedUrl = await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET || 'digital-products',
      file_key,
      24 * 60 * 60 // 24 hours expiration
    );

    // Log download
    await pool.query(
      'INSERT INTO downloads (order_id, user_id, downloaded_at) VALUES ($1, $2, NOW())',
      [order_id, userId]
    );

    res.json({
      download_url: presignedUrl,
      expires_in: 86400 // seconds
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});

// Get download history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT d.*, p.title FROM downloads d
       JOIN orders o ON d.order_id = o.id
       JOIN products p ON o.product_id = p.id
       WHERE o.user_id = $1 ORDER BY d.downloaded_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch download history' });
  }
});

module.exports = router;

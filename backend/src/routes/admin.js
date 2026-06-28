const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const minioClient = require('../config/minio');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Upload product file
router.post('/upload', [verifyToken, verifyAdmin], async (req, res) => {
  try {
    const bucketName = process.env.MINIO_BUCKET || 'digital-products';
    
    // Handle file upload via multipart/form-data
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.files.file;
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    await minioClient.putObject(
      bucketName,
      fileName,
      file.data,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    res.json({
      message: 'File uploaded successfully',
      file_key: fileName,
      file_name: file.name,
      file_size: file.size
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Create product
router.post('/products', [verifyToken, verifyAdmin], async (req, res) => {
  try {
    const { title, description, price, category, file_key, cover_image } = req.body;
    const userId = req.user.id;

    if (!title || !price || !file_key) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO products (user_id, title, description, price, category, cover_image, file_key, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, title, description, price, category, cover_image || null, file_key, 'active']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Dashboard statistics
router.get('/stats', [verifyToken, verifyAdmin], async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
        (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM downloads) as total_downloads
    `);

    res.json(stats.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all products (admin)
router.get('/products', [verifyToken, verifyAdmin], async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM downloads WHERE product_id = p.id) as total_downloads,
              (SELECT COUNT(*) FROM orders WHERE product_id = p.id AND status = 'completed') as total_sales
       FROM products p ORDER BY p.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;

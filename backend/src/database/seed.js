require('dotenv').config();
const pool = require('../config/database');

const seed = async () => {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Get admin user
    const adminResult = await pool.query(
      'SELECT id FROM users WHERE role = $1 LIMIT 1',
      ['admin']
    );

    if (adminResult.rows.length === 0) {
      console.error('❌ No admin user found. Run migration first.');
      process.exit(1);
    }

    const adminId = adminResult.rows[0].id;

    // Sample products
    const products = [
      {
        title: 'Template Website Premium',
        description: 'Template website profesional siap pakai dengan design modern dan responsive',
        price: 99000,
        category: 'Template',
        file_key: 'sample-template-1.zip'
      },
      {
        title: 'E-book Belajar React',
        description: 'Panduan lengkap belajar React dari dasar hingga advanced',
        price: 49000,
        category: 'E-book',
        file_key: 'react-ebook-1.pdf'
      },
      {
        title: 'Course Video Desain Grafis',
        description: 'Kursus video lengkap desain grafis dengan Adobe Creative Suite',
        price: 199000,
        category: 'Video Course',
        file_key: 'design-course-1.zip'
      },
      {
        title: 'Script Website Toko Online',
        description: 'Script PHP siap pakai untuk membuat toko online sendiri',
        price: 149000,
        category: 'Script',
        file_key: 'ecommerce-script-1.zip'
      }
    ];

    // Insert products
    for (const product of products) {
      await pool.query(
        `INSERT INTO products (user_id, title, description, price, category, cover_image, file_key, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [
          adminId,
          product.title,
          product.description,
          product.price,
          product.category,
          'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.title),
          product.file_key,
          'active'
        ]
      );
    }

    console.log('✅ Sample products inserted');
    console.log('✨ Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seed();

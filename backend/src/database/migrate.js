require('dotenv').config();
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const migrate = async () => {
  try {
    console.log('📦 Starting database migration...');

    // Read SQL schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute migration
    await pool.query(schema);
    console.log('✅ Database migration completed successfully');

    // Insert default admin user if not exists
    const adminCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [process.env.ADMIN_EMAIL || 'admin@example.com']
    );

    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'admin123456',
        10
      );

      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        [
          process.env.ADMIN_EMAIL || 'admin@example.com',
          hashedPassword,
          'Admin User',
          'admin'
        ]
      );
      console.log('✅ Admin user created');
    }

    console.log('✨ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
};

migrate();

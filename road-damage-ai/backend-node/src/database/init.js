/**
 * Database initialization script
 * Run with: npm run init-db
 */

require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  console.log('🔧 Initializing database...');

  // Create default admin user if none exists
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM administrators').get();

  if (adminExists.count === 0) {
    console.log('📝 Creating default admin user...');

    const defaultPassword = 'admin123'; // Change in production!
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    db.prepare(`
      INSERT INTO administrators (username, password_hash, full_name, email)
      VALUES (?, ?, ?, ?)
    `).run('admin', passwordHash, 'System Administrator', 'admin@municipality.gov');

    console.log('✅ Default admin created:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change this password immediately!');
  } else {
    console.log('ℹ️  Admin user already exists, skipping creation.');
  }

  // Insert some sample data for testing (optional)
  const reportsExist = db.prepare('SELECT COUNT(*) as count FROM damage_reports').get();

  if (reportsExist.count === 0 && process.argv.includes('--with-samples')) {
    console.log('📝 Creating sample reports...');

    const { v4: uuidv4 } = require('uuid');

    const sampleReports = [
      {
        id: uuidv4(),
        image_path: '/uploads/sample1.jpg',
        latitude: 52.5200,
        longitude: 13.4050,
        status: 'analyzed',
        damage_type: 'pothole',
        severity: 'high',
        estimated_cost: 1500.00,
        description: 'Large pothole on main street',
      },
      {
        id: uuidv4(),
        image_path: '/uploads/sample2.jpg',
        latitude: 52.5180,
        longitude: 13.4080,
        status: 'analyzed',
        damage_type: 'crack',
        severity: 'medium',
        estimated_cost: 800.00,
        description: 'Multiple cracks near intersection',
      },
      {
        id: uuidv4(),
        image_path: '/uploads/sample3.jpg',
        latitude: 52.5220,
        longitude: 13.4020,
        status: 'pending',
        description: 'Road surface damage after rain',
      },
    ];

    const insertStmt = db.prepare(`
      INSERT INTO damage_reports (id, image_path, latitude, longitude, status, damage_type, severity, estimated_cost, description)
      VALUES (@id, @image_path, @latitude, @longitude, @status, @damage_type, @severity, @estimated_cost, @description)
    `);

    for (const report of sampleReports) {
      insertStmt.run(report);
    }

    console.log(`✅ Created ${sampleReports.length} sample reports`);
  }

  console.log('🎉 Database initialization complete!');
  process.exit(0);
}

initializeDatabase().catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

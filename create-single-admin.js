require('dotenv').config();
const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createSingleAdmin() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync database
    await sequelize.sync();
    console.log('Database synchronized.');

    // Check if any admin user exists
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      console.log('If you want to reset the admin password, please delete the existing admin user first.');
      process.exit(0);
    }

    // Create single admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fushidalanka.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
      approvalStatus: 'approved'
    });

    console.log('✅ Single admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔐 Password:', adminPassword);
    console.log('⚠️  IMPORTANT: Please change the default password after first login!');
    console.log('🌐 Admin login URL: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
createSingleAdmin();

require('dotenv').config();
const { sequelize } = require('./config/database');
const User = require('./models/User');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@fushidalanka.com' } });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@fushidalanka.com');
      console.log('Password: admin123');
      return;
    }

    // Create admin user
    const hashedPassword = await require('bcryptjs').hash('admin123', 10);
    await User.create({
      name: 'System Administrator',
      email: 'admin@fushidalanka.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@fushidalanka.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

createAdmin();

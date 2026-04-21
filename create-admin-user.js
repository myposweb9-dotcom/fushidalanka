const { sequelize } = require('./config/database');
const User = require('./models/User');

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@fushidalanka.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1 (555) 123-4567' // Test phone number
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@fushidalanka.com');
    console.log('Password: admin123');
    console.log('Phone: +1 (555) 123-4567');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();

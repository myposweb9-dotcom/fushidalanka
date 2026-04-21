require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/database');
const User = require('./models/User');

async function resetAdminPassword() {
  try {
    await sequelize.sync();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
      process.exit(1);
    }

    const admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      console.error('Admin user not found');
      process.exit(1);
    }

    // Hash the password properly
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await admin.update({ password: hashedPassword });

    console.log('Admin password reset successfully');

    // Also fix other users if they have double-hashed passwords
    const users = await User.findAll();
    for (const user of users) {
      if (user.email !== adminEmail) {
        // For simplicity, let's assume we need to re-hash. But actually, we can't tell.
        // For now, just log them
        console.log(`User ${user.email} has password length: ${user.password.length}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();

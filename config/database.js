const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

// Use PostgreSQL if configured, otherwise use SQLite for development
const dbType = process.env.DB_TYPE || 'sqlite';

if (dbType === 'postgres') {
  // PostgreSQL configuration for production
  sequelize = new Sequelize(
    process.env.DB_NAME || 'fushidhalanka',
    process.env.DB_USER || 'fushidapp',
    process.env.DB_PASSWORD || 'password',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  // SQLite: Simple file-based database for development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../data/fushidalanka.db'),
    logging: false
  });
}

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = { sequelize, testConnection };

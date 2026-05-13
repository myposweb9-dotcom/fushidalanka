const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

// SQLite: Simple file-based database, no setup needed
sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../data/fushidalanka.db'),
  logging: false
});

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

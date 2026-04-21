require('dotenv').config();
const { sequelize } = require('./config/database');
const Content = require('./models/Content');

async function addSampleLogos() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connected.');

    const logos = [
      {
        title: 'SolarTech Solutions',
        image: '/images/logo1.png',
        type: 'logo',
        section: 'partners',
        order: 1
      },
      {
        title: 'GreenEnergy Corp',
        image: '/images/logo2.png',
        type: 'logo',
        section: 'partners',
        order: 2
      },
      {
        title: 'SunPower Systems',
        image: '/images/logo3.png',
        type: 'logo',
        section: 'partners',
        order: 3
      },
      {
        title: 'EcoSolar Ltd',
        image: '/images/logo4.png',
        type: 'logo',
        section: 'partners',
        order: 4
      }
    ];

    for (const logo of logos) {
      await Content.create(logo);
      console.log(`Added logo: ${logo.title}`);
    }

    console.log('All sample logos added successfully!');
  } catch (error) {
    console.error('Error adding sample logos:', error);
  } finally {
    await sequelize.close();
  }
}

addSampleLogos();

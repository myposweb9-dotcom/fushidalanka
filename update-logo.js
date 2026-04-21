require('dotenv').config();
const { sequelize } = require('./config/database');
const Content = require('./models/Content');

async function updateLogo() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Find the RushidaLanka logo
    const rushidaLogo = await Content.findOne({
      where: {
        type: 'logo',
        title: 'RushidaLanka'
      }
    });

    if (rushidaLogo) {
      // Update the logo to Ecovolt and remove image
      await rushidaLogo.update({
        title: 'Ecovolt',
        image: null
      });
      console.log('RushidaLanka logo updated to Ecovolt successfully!');
    } else {
      console.log('RushidaLanka logo not found in database.');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error updating logo:', error);
  }
}

updateLogo();

require('dotenv').config();
const { sequelize } = require('./config/database');
const Category = require('./models/Category');

async function addCategories() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const categories = [
      { name: 'Tools & Equipment', slug: 'tools', description: 'Professional tools and equipment for contractors and DIYers', status: 'active' },
      { name: 'Building Materials', slug: 'materials', description: 'Quality building materials for construction projects', status: 'active' },
      { name: 'Electrical Supplies', slug: 'electrical', description: 'Electrical wiring, switches, and components', status: 'active' },
      { name: 'Safety Gear', slug: 'safety', description: 'Personal protective equipment and safety solutions', status: 'active' }
    ];

    for (const categoryData of categories) {
      const [category, created] = await Category.findOrCreate({
        where: { slug: categoryData.slug },
        defaults: categoryData
      });

      if (created) {
        console.log(`Category "${category.name}" created with ID: ${category.id}`);
      } else {
        console.log(`Category "${category.name}" already exists`);
      }
    }

    console.log('Categories setup completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error adding categories:', error);
    process.exit(1);
  }
}

addCategories();

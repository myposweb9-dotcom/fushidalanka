require('dotenv').config();
const { sequelize } = require('./config/database');
const Product = require('./models/Product');
const Category = require('./models/Category');

async function addProducts() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const categories = {
      'tools': await Category.findOne({ where: { slug: 'tools' } }),
      'materials': await Category.findOne({ where: { slug: 'materials' } }),
      'electrical': await Category.findOne({ where: { slug: 'electrical' } }),
      'safety': await Category.findOne({ where: { slug: 'safety' } })
    };

    if (!Object.values(categories).every(c => c)) {
      console.error('Not all categories found. Please run add-categories.js first.');
      process.exit(1);
    }

    const products = [
      {
        name: 'Professional Cordless Drill',
        description: 'Powerful 20V lithium-ion cordless drill with 2-speed transmission for drilling and driving.',
        price: '4999',
        categoryId: categories.tools.id,
        images: ['/uploads/drill.jpg'],
        specifications: {
          'Voltage': '20V',
          'Battery': 'Lithium-ion',
          'Speed': '0-1500 RPM',
          'Warranty': '2 years'
        },
        status: 'active',
        featured: true
      },
      {
        name: 'Premium Cement 50KG',
        description: 'High-quality Portland cement suitable for construction and building projects.',
        price: '2500',
        categoryId: categories.materials.id,
        images: ['/uploads/cement.jpg'],
        specifications: {
          'Type': 'Portland Cement',
          'Size': '50KG',
          'Strength': 'Grade 53',
          'Shelf Life': '6 months'
        },
        status: 'active',
        featured: true
      },
      {
        name: 'Electrical Wire Cable 2.5mm',
        description: 'Heavy-duty 2.5mm electrical copper wire for residential and commercial wiring.',
        price: '650',
        categoryId: categories.electrical.id,
        images: ['/uploads/cable.jpg'],
        specifications: {
          'Size': '2.5mm²',
          'Material': 'Copper',
          'Length': '100 meters',
          'Amperage': '16A'
        },
        status: 'active',
        featured: true
      },
      {
        name: 'Safety Helmet Yellow',
        description: 'ANSI certified safety helmet for construction and industrial use.',
        price: '1200',
        categoryId: categories.safety.id,
        images: ['/uploads/helmet.jpg'],
        specifications: {
          'Type': 'Hard Hat',
          'Color': 'Yellow',
          'Certification': 'ANSI Z89.1',
          'Material': 'ABS Plastic'
        },
        status: 'active',
        featured: true
      },
      {
        name: 'Work Gloves Leather',
        description: 'Durable work gloves made from genuine leather with rubberized grip.',
        price: '350',
        categoryId: categories.tools.id,
        images: ['/uploads/gloves.jpg'],
        specifications: {
          'Material': 'Leather',
          'Grip': 'Rubberized',
          'Size': 'Universal',
          'Comfort': 'Extra padding'
        },
        status: 'active',
        featured: true
      },
      {
        name: 'Steel Measuring Tape',
        description: '10 meter professional steel measuring tape with ergonomic grip.',
        price: '890',
        categoryId: categories.tools.id,
        images: ['/uploads/tape.jpg'],
        specifications: {
          'Length': '10 meters',
          'Material': 'Steel',
          'Width': '25mm',
          'Accuracy': '±1.5mm'
        },
        status: 'active',
        featured: true
      }
    ];

    for (const productData of products) {
      const [product, created] = await Product.findOrCreate({
        where: { name: productData.name },
        defaults: productData
      });

      if (created) {
        console.log(`Product "${product.name}" created with ID: ${product.id}`);
      } else {
        console.log(`Product "${product.name}" already exists`);
      }
    }

    console.log('Products setup completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error adding products:', error);
    process.exit(1);
  }
}

addProducts();

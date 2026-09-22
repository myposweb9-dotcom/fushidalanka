require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const PRODUCT_COUNT = 32;

async function main() {
  await sequelize.authenticate();
  await sequelize.sync({ force: false });

  const imageFiles = fs.readdirSync(uploadsDir)
    .filter(name => /^admin-product-image-.*\.(png|jpe?g|webp|avif)$/i.test(name))
    .sort();

  if (imageFiles.length < PRODUCT_COUNT) {
    throw new Error(`Need at least ${PRODUCT_COUNT} recovered product images, found ${imageFiles.length}`);
  }

  let category = await Category.findOne({ order: [['id', 'ASC']] });
  if (!category) {
    category = await Category.create({ name: 'Tools', slug: 'tools' });
  }

  const records = [];
  for (let i = 1; i <= PRODUCT_COUNT; i += 1) {
    const name = `Product ${i}`;
    const image = `/uploads/${imageFiles[i - 1]}`;
    const values = {
      name,
      description: 'Premium quality product for your next project.',
      categoryId: category.id,
      price: null,
      specifications: null,
      images: [image],
      datasheet: null,
      stock: 0,
      minOrder: 1,
      warranty: null,
      whatsappLink: null,
      status: 'active',
      featured: false,
      userId: null
    };

    const [product, created] = await Product.findOrCreate({
      where: { name },
      defaults: values
    });
    if (!created) await product.update(values);
    records.push({ id: product.id, name, image, action: created ? 'created' : 'updated' });
  }

  console.table(records);
  console.log(`Imported ${records.length} active products using category ${category.id} (${category.name}).`);
}

main()
  .catch(error => {
    console.error('Recovery import failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });

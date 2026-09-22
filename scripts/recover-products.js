require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const PRODUCT_COUNT = 32;
// Exact image order from the last working storefront catalogue. Product 1 gets
// the newest catalogue image, and Product 32 gets the oldest catalogue image.
const exactImageFiles = [
  'admin-product-image-1790091490499-850363932.jpeg',
  'admin-product-image-1790091452656-402676383.jpeg',
  'admin-product-image-1790091404137-67473303.jpeg',
  'admin-product-image-1790091357089-145402818.jpeg',
  'admin-product-image-1790091240161-223619555.jpeg',
  'admin-product-image-1790091189262-357811753.jpeg',
  'admin-product-image-1790091157788-668683656.jpeg',
  'admin-product-image-1790091130055-472421099.jpeg',
  'admin-product-image-1790091089264-762502279.jpeg',
  'admin-product-image-1790091047543-825717090.jpeg',
  'admin-product-image-1790090995913-652613547.jpeg',
  'admin-product-image-1790090961945-561188354.jpeg',
  'admin-product-image-1790090927675-68873547.jpeg',
  'admin-product-image-1790090892255-511281195.jpeg',
  'admin-product-image-1790090844682-735837275.jpeg',
  'admin-product-image-1790090811448-726654425.jpeg',
  'admin-product-image-1790090755302-446919638.jpeg',
  'admin-product-image-1790090715275-842497783.jpeg',
  'admin-product-image-1790090670438-1915046.jpeg',
  'admin-product-image-1790090595490-450366768.jpeg',
  'admin-product-image-1790090549260-828670804.jpeg',
  'admin-product-image-1789535379399-937828693.jpeg',
  'admin-product-image-1789535348673-873874124.jpeg',
  'admin-product-image-1789535310617-412401555.jpeg',
  'admin-product-image-1789535286840-806156573.jpeg',
  'admin-product-image-1789535260163-359026009.jpeg',
  'admin-product-image-1789535230719-924704343.jpeg',
  'admin-product-image-1789535207938-767077453.jpeg',
  'admin-product-image-1789535173838-86183620.jpeg',
  'admin-product-image-1789535042137-861399619.jpeg',
  'admin-product-image-1789535016202-326159411.jpeg',
  'admin-product-image-1789534986505-200985467.jpeg'
];

async function main() {
  await sequelize.authenticate();
  await sequelize.sync({ force: false });

  const missingImages = exactImageFiles.filter(name => !fs.existsSync(path.join(uploadsDir, name)));
  if (missingImages.length) {
    throw new Error(`Missing exact uploaded images: ${missingImages.join(', ')}`);
  }

  let category = await Category.findOne({ order: [['id', 'ASC']] });
  if (!category) {
    category = await Category.create({ name: 'Tools', slug: 'tools' });
  }

  const records = [];
  for (let i = 1; i <= PRODUCT_COUNT; i += 1) {
    const name = `Product ${i}`;
    const image = `/uploads/${exactImageFiles[i - 1]}`;
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

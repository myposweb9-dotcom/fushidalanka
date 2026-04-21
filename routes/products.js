const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { isAdmin } = require('../middleware/auth');

// GET all products for the admin panel
router.get('/', isAdmin, async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name'] // Include category details
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(products); // Send products as JSON
  } catch (error) {
    console.error('Error fetching products for admin:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;
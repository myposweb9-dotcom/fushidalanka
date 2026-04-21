const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { isAdmin } = require('../middleware/auth');

// GET all categories
router.get('/', isAdmin, async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories for admin:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST a new category
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const newCategory = await Category.create({ name });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT (update) a category
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    category.name = name;
    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE a category
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const result = await Category.destroy({ where: { id: req.params.id } });
    if (result === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
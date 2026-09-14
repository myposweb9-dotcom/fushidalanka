const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Content = require('../models/Content');
const News = require('../models/News');
const Project = require('../models/Project');
const Enquiry = require('../models/Enquiry');
const Category = require('../models/Category');

console.log('Routes/index.js loaded successfully');

// Home page
router.get('/', async (req, res) => {
  try {
    console.log('Homepage route called');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    // Fetch data for homepage
    let [featuredProducts, testimonials, news, projects, logos] = await Promise.all([
      Product.findAll({
        where: { status: 'active', featured: true },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
        order: [['updatedAt', 'DESC'], ['createdAt', 'DESC']],
        limit: 12
      }),
      Content.findAll({ where: { type: 'testimonial' }, limit: 3 }),
      News.findAll({ limit: 3, order: [['createdAt', 'DESC']] }),
      Project.findAll({ limit: 3, order: [['createdAt', 'DESC']] }),
      Content.findAll({ where: { type: 'logo', isActive: true } })
    ]);

    // Keep the homepage populated from the real catalog even when no products are flagged as featured.
    if (!featuredProducts.length) {
      featuredProducts = await Product.findAll({
        where: { status: 'active' },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
        order: [['updatedAt', 'DESC'], ['createdAt', 'DESC']],
        limit: 8
      });
    }

    res.render('index', {
      title: 'FushidaLanka - Hardware Shop',
      featuredProducts,
      testimonials,
      news,
      projects,
      logos
    });
  } catch (error) {
    console.error('Error in homepage route:', error);
    res.status(500).render('error', { title: 'Error', message: 'Something went wrong!' });
  }
});

// About Us page
router.get('/about', async (req, res) => {
  try {
    const aboutContent = await Content.findOne({ where: { type: 'about' } });
    res.render('about', {
      title: 'About Us - FushidaLanka',
      aboutContent
    });
  } catch (error) {
    console.error('Error fetching about content:', error);
    res.render('about', { title: 'About Us - FushidaLanka' });
  }
});

// Our Partners page
router.get('/our-partners', async (req, res) => {
  try {
    const partnersContent = await Content.findOne({ where: { type: 'partners' } });
    res.render('our-partners', {
      title: 'Our Partners - FushidaLanka',
      partnersContent
    });
  } catch (error) {
    console.error('Error fetching partners content:', error);
    res.render('our-partners', { title: 'Our Partners - FushidaLanka' });
  }
});

// Awards & Recognition page
router.get('/awards-recognition', async (req, res) => {
  try {
    const awardsContent = await Content.findOne({ where: { type: 'awards' } });
    res.render('awards-recognition', {
      title: 'Awards & Recognition - FushidaLanka',
      awardsContent
    });
  } catch (error) {
    console.error('Error fetching awards content:', error);
    res.render('awards-recognition', { title: 'Awards & Recognition - FushidaLanka' });
  }
});

// Products page route
router.get('/products', async (req, res) => {
  try {
    const Content = require('../models/Content');
    const categoryQuery = String(req.query.category || '').trim();
    const categoryInclude = {
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'slug'],
      ...(categoryQuery ? {
        required: true,
        where: Number.isNaN(Number(categoryQuery)) ? { slug: categoryQuery } : { id: Number(categoryQuery) }
      } : {})
    };
    const products = await Product.findAll({
      where: { status: 'active' },
      include: [categoryInclude],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const categories = await Category.findAll({
      attributes: ['id', 'name', 'slug'],
      order: [['name', 'ASC']]
    });

    const logos = await Content.findAll({
      where: { type: 'logo' },
      order: [['order', 'ASC']]
    });

    // Debug: Log what's being passed to template
    const productsArray = Array.isArray(products) ? products : (products ? [products] : []);
    console.log(`Route /products: Found ${productsArray.length} products`);
    
    res.render('products', {
      title: 'Products - FushidaLanka',
      products: productsArray,
      categories: categories || [],
      logos: logos || [],
      currentPath: '/products'
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.render('products', {
      title: 'Products - FushidaLanka',
      products: [],
      categories: [],
      logos: [],
      currentPath: '/products'
    });
  }
});

// Standalone categories page
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({ attributes: ['id', 'name', 'slug'], order: [['name', 'ASC']] });
    res.render('categories', { title: 'Categories - FushidaLanka', categories });
  } catch (error) {
    console.error('Error fetching categories page:', error);
    res.render('categories', { title: 'Categories - FushidaLanka', categories: [] });
  }
});

// Standalone bulk order and trade supply page
router.get('/bulk-order', (req, res) => {
  res.render('bulk-order', { title: 'Bulk Order & Trade Supply - FushidaLanka' });
});

// Product detail page - use params for cleaner URLs
router.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('Fetching product with ID:', productId);
    const product = await Product.findOne({
      where: { id: productId, status: 'active' },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });
    console.log('Product found:', product ? product.name : 'null');
    if (!product) {
      return res.status(404).render('404', { title: 'Product Not Found' });
    }
    console.log('Rendering product-detail view');
    res.render('product-detail', {
      title: `${product.name} - FushidaLanka`,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load product' });
  }
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us - FushidaLanka' });
});

// Services and legal pages
router.get('/services', (req, res) => {
  res.render('services', { title: 'Services - FushidaLanka' });
});

router.get('/privacy', (req, res) => {
  res.render('legal', { title: 'Privacy Policy - FushidaLanka', pageTitle: 'Privacy Policy', kind: 'privacy' });
});

router.get('/terms', (req, res) => {
  res.render('legal', { title: 'Terms of Service - FushidaLanka', pageTitle: 'Terms of Service', kind: 'terms' });
});

// Projects page
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
    res.render('projects', {
      title: 'Our Projects - FushidaLanka',
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.render('projects', {
      title: 'Our Projects - FushidaLanka',
      projects: []
    });
  }
});

// News page
router.get('/news', async (req, res) => {
  try {
    const news = await News.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
    res.render('news', {
      title: 'News & Updates - FushidaLanka',
      news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.render('news', {
      title: 'News & Updates - FushidaLanka',
      news: []
    });
  }
});

// Team page
router.get('/team', async (req, res) => {
  try {
    const team = await Content.findAll({
      where: { type: 'team' },
      order: [['order', 'ASC']]
    });
    res.render('team', {
      title: 'Our Team - FushidaLanka',
      team
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.render('team', {
      title: 'Our Team - FushidaLanka',
      team: []
    });
  }
});

router.get('/news/:slug', async (req, res) => {
  try {
    const where = /^\d+$/.test(req.params.slug) ? { id: Number(req.params.slug) } : { slug: req.params.slug };
    const item = await News.findOne({ where });
    if (!item) return res.status(404).send('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>News Not Found - FushidaLanka</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:Arial,sans-serif;max-width:720px;margin:80px auto;padding:20px"><h1>News item not found</h1><p>The update you requested is no longer available.</p><a href="/news">Back to news</a></body></html>');
    res.render('news-detail', { title: `${item.title} - FushidaLanka`, item });
  } catch (error) {
    console.error('Error fetching news item:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load news item' });
  }
});

// Contact form submission
router.post('/contact', async (req, res) => {
  try {
    await Enquiry.create(req.body);
    res.json({ success: true, message: 'Thank you for your message!' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;

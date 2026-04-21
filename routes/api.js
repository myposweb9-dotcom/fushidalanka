const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { isAuthenticatedAPI } = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
const Enquiry = require('../models/Enquiry');

const Content = require('../models/Content');
const News = require('../models/News');
const Project = require('../models/Project');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all categories (public)
router.get('/categories', async (req, res) => {
  try {
    const Category = require('../models/Category');
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'slug']
    });

    // Always include "All Products" category at the beginning
    const allProductsCategory = {
      id: 0,
      name: 'All Products',
      slug: 'all'
    };

    const categoriesWithAll = [allProductsCategory, ...categories];
    res.json(categoriesWithAll);
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return default categories including "All Products" if database fails
    const defaultCategories = [
      { id: 0, name: 'All Products', slug: 'all' },
      { id: 1, name: 'Solar Panels', slug: 'panels' },
      { id: 2, name: 'Inverters', slug: 'inverters' },
      { id: 3, name: 'Batteries', slug: 'batteries' },
      { id: 4, name: 'Accessories', slug: 'accessories' }
    ];
    res.json(defaultCategories);
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = (page - 1) * limit;
    const categoryId = req.query.categoryId;

    let where = { status: 'active' };
    if (categoryId && categoryId !== 'all' && categoryId !== '0') {
      where.categoryId = categoryId;
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      offset,
      limit,
      include: [{
        model: require('../models/Category'),
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }],
      attributes: ['id', 'name', 'description', 'price', 'categoryId', 'images', 'specifications', 'createdAt', 'updatedAt']
    });
    // Transform images array for frontend - images are already stored with /uploads/ prefix
    const transformedProducts = products.map(product => {
      const productData = product.toJSON();
      // Ensure images is always an array
      let images = productData.images || [];
      if (typeof images === 'string') {
        images = [images];
      } else if (!Array.isArray(images)) {
        images = [];
      }
      return {
        ...productData,
        images
      };
    });
    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      products: transformedProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, status: 'active' }
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const transformedProduct = {
      ...product.toJSON(),
      images: product.images || []
    };
    res.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get admin-uploaded products
router.get('/admin-products', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      where: { status: 'active' },
      offset,
      limit,
      include: [{
        model: require('../models/Category'),
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }, {
        model: User,
        as: 'user',
        where: { role: 'admin' },
        attributes: ['id', 'name', 'email', 'role']
      }],
      attributes: ['id', 'name', 'description', 'price', 'categoryId', 'images', 'specifications', 'createdAt', 'updatedAt', 'userId']
    });

    // Transform images array for frontend - images are already stored with /uploads/ prefix
    const transformedProducts = products.map(product => ({
      ...product.toJSON(),
      images: product.images || []
    }));

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      products: transformedProducts
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Failed to fetch admin products' });
  }
});

// Create new product (user upload - pending review)
router.post('/products', isAuthenticatedAPI, async (req, res) => {
  try {
    const { name, description, price, categoryId, stock } = req.body;
    const images = [];
    let datasheet = null;

    // Handle file uploads using express-fileupload
    if (req.files) {
      // Handle product image
      if (req.files.image) {
        const imageFile = req.files.image;
        const imageName = `product-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
        const imagePath = path.join(uploadsDir, imageName);

        // Validate image file type
        if (!imageFile.mimetype.startsWith('image/')) {
          return res.status(400).json({ error: 'Invalid image file type' });
        }

        // Move image file
        await imageFile.mv(imagePath);
        images.push('/uploads/' + imageName);
      }

      // Handle datasheet
      if (req.files.datasheet) {
        const datasheetFile = req.files.datasheet;
        const datasheetName = `product-datasheet-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(datasheetFile.name)}`;
        const datasheetPath = path.join(uploadsDir, datasheetName);

        // Validate PDF file type
        if (datasheetFile.mimetype !== 'application/pdf') {
          return res.status(400).json({ error: 'Datasheet must be a PDF file' });
        }

        // Move datasheet file
        await datasheetFile.mv(datasheetPath);
        datasheet = '/uploads/' + datasheetName;
      }
    }

    // Validate required fields
    if (!name || !description || !categoryId) {
      return res.status(400).json({ error: 'Name, description, and category are required' });
    }

    // Create product with pending status
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      categoryId: parseInt(categoryId),
      stock: parseInt(stock) || 0,
      images,
      datasheet,
      status: 'pending', // User uploads need admin approval
      userId: req.user.id // Associate with the authenticated user
    });

    console.log('Product created successfully:', {
      id: product.id,
      name: product.name,
      status: product.status,
      userId: product.userId
    });

    res.status(201).json({
      success: true,
      message: 'Product submitted for review successfully',
      product: {
        id: product.id,
        name: product.name,
        status: product.status
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const whereClause = { type: 'testimonial', isActive: true };
    if (req.query.featured === 'true') {
      whereClause.featured = true;
    }

    const testimonials = await Content.findAll({
      where: whereClause,
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
      attributes: ['id', 'title', 'content', 'image', 'metadata', 'createdAt']
    });

    // Transform for frontend
    const transformedTestimonials = testimonials.map(testimonial => ({
      id: testimonial.id,
      name: testimonial.title,
      content: testimonial.content,
      company: testimonial.metadata?.company,
      position: testimonial.metadata?.position,
      image: testimonial.image,
      rating: testimonial.metadata?.rating || 5
    }));

    res.json(transformedTestimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Get news
router.get('/news', async (req, res) => {
  try {
    const news = await News.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'content', 'excerpt', 'featuredImage', 'author', 'published', 'createdAt']
    });
    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Get projects
router.get('/projects', async (req, res) => {
  try {
    const whereClause = { status: 'completed' };
    if (req.query.featured === 'true') {
      whereClause.featured = true;
    }

    const projects = await Project.findAll({
      where: whereClause,
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'description', 'category', 'location', 'completionDate', 'images', 'status', 'createdAt']
    });

    // Helper function to convert Google Drive URLs to direct download links
    const convertGoogleDriveUrl = (url) => {
      if (!url) return url;

      // Check if it's a Google Drive sharing URL
      const driveMatch = url.match(/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (driveMatch) {
        return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
      }

      // Check if it's already a direct download URL
      if (url.includes('drive.google.com/uc?')) {
        return url;
      }

      return url;
    };

    // Transform images array for frontend - handle Google Drive URLs
    const transformedProjects = projects.map(project => {
      const projectData = project.toJSON();
      return {
        ...projectData,
        images: (projectData.images || []).map(convertGoogleDriveUrl),
        image: projectData.images && projectData.images.length > 0 ? convertGoogleDriveUrl(projectData.images[0]) : null
      };
    });
    res.json(transformedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get team members
router.get('/team', async (req, res) => {
  try {
    const team = await Content.findAll({
      where: { type: 'team', isActive: true },
      order: [['order', 'ASC']],
      attributes: ['id', 'title', 'content', 'image', 'metadata', 'order', 'createdAt']
    });
    // Transform for frontend - rename title to name, content to bio, etc.
    const transformedTeam = team.map(member => ({
      id: member.id,
      name: member.title,
      position: member.metadata?.position || '',
      bio: member.content,
      image: member.image,
      linkedin: member.metadata?.linkedin,
      twitter: member.metadata?.twitter,
      email: member.metadata?.email
    }));
    res.json(transformedTeam);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Get services
router.get('/services', async (req, res) => {
  try {
    const services = await Content.findAll({
      where: { type: 'service' },
      attributes: ['id', 'title', 'content', 'image', 'order', 'createdAt']
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Contact form submission
router.post('/contact', async (req, res) => {
  try {
    const enquiryData = {
      type: 'contact',
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message
    };
    await Enquiry.create(enquiryData);
    res.json({ success: true, message: 'Thank you for your message!' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require('passport');
const { isAdmin } = require('../middleware/auth');
const { Sequelize, Op } = require('sequelize');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Content = require('../models/Content');
const Enquiry = require('../models/Enquiry');
const News = require('../models/News');
const Project = require('../models/Project');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login - FushidaLanka' });
});

// Admin login POST
router.post('/login', (req, res, next) => {
  console.log('Admin login attempt for email:', req.body.email);
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Admin login error:', err);
      req.flash('error', 'Login failed due to server error');
      return res.redirect('/admin/login');
    }
    if (!user) {
      console.log('Admin login failed: Invalid credentials for', req.body.email);
      req.flash('error', info.message || 'Invalid email or password');
      return res.redirect('/admin/login');
    }
    console.log('User found:', user.email, 'Role:', user.role, 'Active:', user.isActive);
    if (user.role !== 'admin') {
      console.log('Admin login denied: User is not admin');
      req.flash('error', 'Access denied. Admin privileges required.');
      return res.redirect('/admin/login');
    }
    if (!user.isActive) {
      console.log('Admin login denied: Account deactivated');
      req.flash('error', 'Account is deactivated');
      return res.redirect('/admin/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Admin login session error:', err);
        req.flash('error', 'Login failed. Please try again.');
        return res.redirect('/admin/login');
      }
      console.log('Admin login successful for:', user.email);
      req.flash('success', 'Welcome back, Admin!');
      return res.redirect('/admin/dashboard');
    });
  })(req, res, next);
});

// Admin dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    // Get statistics
    const stats = {
      products: await Product.count(),
      users: await User.count({ where: { role: 'user' } }),
      enquiries: await Enquiry.count(),
      projects: await Project.count(),
      panels: await Product.count({ where: { categoryId: 1 } }), // Assuming category 1 is panels
      inverters: await Product.count({ where: { categoryId: 2 } }), // Assuming category 2 is inverters
      batteries: await Product.count({ where: { categoryId: 3 } }), // Assuming category 3 is batteries
      accessories: await Product.count({ where: { categoryId: 4 } }) // Assuming category 4 is accessories
    };

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - FushidaLanka',
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load dashboard' });
  }
});

// Admin logout
router.get('/logout', isAdmin, (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      req.flash('error', 'Logout failed');
    } else {
      req.flash('success', 'Logged out successfully');
    }
    res.redirect('/admin/login');
  });
});

// Products management
router.get('/products', isAdmin, async (req, res) => {
  try {
    const allProducts = await Product.findAll({
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
        required: false
      }, {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    res.render('admin/products', {
      title: 'Manage Products - Admin',
      products: allProducts || [],
      categories: categories || []
    });
  } catch (error) {
    console.error('Products management error:', error.message);
    console.error('Full error stack:', error.stack);
    res.status(500).render('error', { title: 'Error', message: error.message || 'Failed to load products' });
  }
});

// Approve product
router.post('/products/approve/:id', isAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    await product.update({ status: 'active' });
    req.flash('success', 'Product approved successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Product approval error:', error);
    req.flash('error', 'Failed to approve product');
    res.redirect('/admin/products');
  }
});

// Reject product
router.post('/products/reject/:id', isAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    await product.destroy();
    req.flash('success', 'Product rejected and removed');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Product rejection error:', error);
    req.flash('error', 'Failed to reject product');
    res.redirect('/admin/products');
  }
});

// Edit product (via modal/AJAX)
router.post('/products/update/:id', isAdmin, async (req, res) => {
  try {
    console.log('Edit product request:', { id: req.params.id, body: req.body });
    
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      categoryId: req.body.categoryId,
      status: req.body.status,
      stock: req.body.stock,
      whatsappLink: req.body.whatsappLink
    };

    // Handle file uploads
    let images = product.images || [];
    let datasheet = product.datasheet;

    // Handle product images
    if (req.files && req.files.image) {
      images = []; // Reset images if new ones are uploaded
      const imageFiles = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
      for (const file of imageFiles) {
        // Validate image file type
        if (!file.mimetype.startsWith('image/')) {
          return res.status(400).json({ success: false, message: 'Only image files are allowed for images!' });
        }
        const imageName = `admin-product-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.name)}`;
        const imagePath = path.join(uploadsDir, imageName);
        await file.mv(imagePath);
        images.push('/uploads/' + imageName);
      }
      updateData.images = images;
    }

    // Handle datasheet
    if (req.files && req.files.datasheet) {
      const datasheetFile = req.files.datasheet;
      // Validate PDF file type
      if (datasheetFile.mimetype !== 'application/pdf') {
        return res.status(400).json({ success: false, message: 'Only PDF files are allowed for datasheets!' });
      }
      const datasheetName = `admin-product-datasheet-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(datasheetFile.name)}`;
      const datasheetPath = path.join(uploadsDir, datasheetName);
      await datasheetFile.mv(datasheetPath);
      datasheet = '/uploads/' + datasheetName;
      updateData.datasheet = datasheet;
    }

    console.log('Updating product with data:', updateData);
    await product.update(updateData);
    console.log('Product updated successfully');

    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ success: true, message: 'Product updated successfully' });
    }

    req.flash('success', 'Product updated successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Product edit error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
    }
    req.flash('error', 'Failed to update product');
    res.redirect('/admin/products');
  }
});

// Get product details (for editing)
router.get('/products/:id/json', isAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// Delete product
router.post('/products/delete/:id', isAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    await product.destroy();
    req.flash('success', 'Product deleted successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Product deletion error:', error);
    req.flash('error', 'Failed to delete product');
    res.redirect('/admin/products');
  }
});

// Add product
router.post('/products', isAdmin, async (req, res) => {
  try {
    const { name, description, price, categoryId, stock, specifications, status, whatsappLink } = req.body;
    const images = [];
    let datasheet = null;

    // Handle file uploads using express-fileupload
    if (req.files) {
      // Handle product images
      if (req.files.image) {
        const imageFiles = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
        for (const file of imageFiles) {
          const imageName = `admin-product-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.name)}`;
          const imagePath = path.join(uploadsDir, imageName);

          // Validate image file type
          if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ success: false, message: 'Only image files are allowed for images!' });
          }

          // Move image file
          await file.mv(imagePath);
          images.push('/uploads/' + imageName);
        }
      }

      // Handle datasheet
      if (req.files.datasheet) {
        const datasheetFile = req.files.datasheet;
        const datasheetName = `admin-product-datasheet-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(datasheetFile.name)}`;
        const datasheetPath = path.join(uploadsDir, datasheetName);

        // Validate PDF file type
        if (datasheetFile.mimetype !== 'application/pdf') {
          return res.status(400).json({ success: false, message: 'Only PDF files are allowed for datasheets!' });
        }

        // Move datasheet file
        await datasheetFile.mv(datasheetPath);
        datasheet = '/uploads/' + datasheetName;
      }
    }

    // Parse specifications from textarea format (one per line) to JSON
    let parsedSpecifications = null;
    if (specifications && specifications.trim()) {
      try {
        // Check if it's already JSON
        if (specifications.trim().startsWith('{') || specifications.trim().startsWith('[')) {
          parsedSpecifications = JSON.parse(specifications);
        } else {
          // Parse from textarea format: "Power: 500W\nVoltage: 24V" -> {"Power": "500W", "Voltage": "24V"}
          const specsObj = {};
          const lines = specifications.split('\n').map(line => line.trim()).filter(line => line);
          lines.forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
              const key = line.substring(0, colonIndex).trim();
              const value = line.substring(colonIndex + 1).trim();
              if (key && value) {
                specsObj[key] = value;
              }
            }
          });
          parsedSpecifications = Object.keys(specsObj).length > 0 ? specsObj : null;
        }
      } catch (error) {
        console.error('Error parsing specifications:', error);
        parsedSpecifications = null;
      }
    }

    await Product.create({
      name,
      description,
      price,
      categoryId,
      stock: stock || 0,
      specifications: parsedSpecifications,
      images,
      datasheet: datasheet,
      status: status || 'active',
      whatsappLink,
      userId: req.user.id
    });

    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ success: true, message: 'Product added successfully' });
    }

    req.flash('success', 'Product added successfully');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Product creation error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    let errorMessage = 'Failed to add product';

    // Provide more specific error messages
    if (error.name === 'SequelizeValidationError') {
      errorMessage = error.errors.map(err => err.message).join(', ');
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      errorMessage = 'Invalid category selected';
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = 'Product with this name already exists';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Final error message:', errorMessage);

    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ success: false, message: errorMessage });
    }

    req.flash('error', errorMessage);
    res.redirect('/admin/products');
  }
});

// View single product
router.get('/products/:id', isAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }, {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    res.render('admin/product-detail', {
      title: `Product: ${product.name} - Admin`,
      product
    });
  } catch (error) {
    console.error('Product detail error:', error);
    req.flash('error', 'Failed to load product details');
    res.redirect('/admin/products');
  }
});

// Categories management
router.get('/categories', isAdmin, async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{
        model: Product,
        as: 'products',
        attributes: ['id']
      }],
      order: [['name', 'ASC']]
    });

    res.render('admin/categories', {
      title: 'Manage Categories - Admin',
      categories
    });
  } catch (error) {
    console.error('Categories management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load categories' });
  }
});

// Add category
router.post('/categories', isAdmin, async (req, res) => {
  try {
    const { name, slug, description, status } = req.body;

    await Category.create({
      name,
      slug,
      description: description || null,
      status: status || 'active',
      userId: req.user.id
    });

    req.flash('success', 'Category added successfully');
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Category creation error:', error);
    req.flash('error', 'Failed to add category');
    res.redirect('/admin/categories');
  }
});

// Edit category
router.post('/categories/edit/:id', isAdmin, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/categories');
    }

    await category.update({
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description || null,
      status: req.body.status
    });

    req.flash('success', 'Category updated successfully');
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Category edit error:', error);
    req.flash('error', 'Failed to update category');
    res.redirect('/admin/categories');
  }
});

// Delete category
router.post('/categories/delete/:id', isAdmin, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/categories');
    }

    await category.destroy();
    req.flash('success', 'Category deleted successfully');
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Category deletion error:', error);
    req.flash('error', 'Failed to delete category');
    res.redirect('/admin/categories');
  }
});

// Users management
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/users', {
      title: 'Manage Users - Admin',
      users
    });
  } catch (error) {
    console.error('Users management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load users' });
  }
});

// Approve user
router.post('/users/approve/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    await user.update({ approvalStatus: 'approved' });
    req.flash('success', 'User approved successfully');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User approval error:', error);
    req.flash('error', 'Failed to approve user');
    res.redirect('/admin/users');
  }
});

// Reject user
router.post('/users/reject/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    await user.update({ approvalStatus: 'rejected' });
    req.flash('success', 'User rejected successfully');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User rejection error:', error);
    req.flash('error', 'Failed to reject user');
    res.redirect('/admin/users');
  }
});

// Delete user
router.post('/users/delete/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      req.flash('error', 'Cannot delete admin users');
      return res.redirect('/admin/users');
    }

    // Check if user has products
    const userProducts = await Product.findAll({ where: { userId: user.id } });
    if (userProducts.length > 0) {
      req.flash('error', `Cannot delete user: User has ${userProducts.length} product(s). Please delete or reassign products first.`);
      return res.redirect('/admin/users');
    }

    await user.destroy();
    req.flash('success', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User deletion error:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      req.flash('error', 'Cannot delete user: User has associated data. Please contact support.');
    } else {
      req.flash('error', 'Failed to delete user');
    }
    res.redirect('/admin/users');
  }
});

// Create new user
router.post('/users/create', isAdmin, async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      req.flash('error', 'Name, email, and password are required');
      return res.redirect('/admin/users');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long');
      return res.redirect('/admin/users');
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/admin/users');
    }

    const userRole = role && ['admin', 'user'].includes(role) ? role : 'user';

    // Create user (password will be hashed by beforeCreate hook)
    const newUser = await User.create({
      name,
      email,
      password,
      phone: phone || null,
      role: userRole,
      approvalStatus: 'approved', // Auto-approve admin-created users
      isActive: true
    });

    req.flash('success', `User "${name}" created successfully with role "${userRole}"`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User creation error:', error);
    req.flash('error', 'Failed to create user');
    res.redirect('/admin/users');
  }
});

// Update user role
router.post('/users/update-role/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    const { role } = req.body;
    if (!role || !['admin', 'user'].includes(role)) {
      req.flash('error', 'Invalid role');
      return res.redirect('/admin/users');
    }

    const oldRole = user.role;
    await user.update({ role });

    req.flash('success', `User role updated from "${oldRole}" to "${role}"`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('User role update error:', error);
    req.flash('error', 'Failed to update user role');
    res.redirect('/admin/users');
  }
});

// Orders management (placeholder - implement when orders are added)
router.get('/orders', isAdmin, (req, res) => {
  res.render('admin/orders', {
    title: 'Manage Orders - Admin',
    orders: [] // Placeholder
  });
});

// Testimonials management
router.get('/testimonials', isAdmin, async (req, res) => {
  try {
    const testimonials = await Content.findAll({
      where: { type: 'testimonial' },
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/testimonials', {
      title: 'Manage Testimonials - Admin',
      testimonials
    });
  } catch (error) {
    console.error('Testimonials management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load testimonials' });
  }
});

// Add testimonial
router.post('/testimonials', isAdmin, async (req, res) => {
  try {
    const { title, company, position, content, rating, featured } = req.body;
    let imagePath = null;

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const imageName = `testimonial-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
      const imageFullPath = path.join(uploadsDir, imageName);

      // Validate image file type
      if (!imageFile.mimetype.startsWith('image/')) {
        req.flash('error', 'Only image files are allowed');
        return res.redirect('/admin/testimonials');
      }

      // Move image file
      await imageFile.mv(imageFullPath);
      imagePath = '/uploads/' + imageName;
    }

    await Content.create({
      type: 'testimonial',
      page: 'about',
      section: 'testimonials',
      title,
      content,
      company: company || null,
      position: position || null,
      image: imagePath,
      rating: rating || 5,
      featured: featured === 'true' || featured === 'on',
      userId: req.user.id
    });

    req.flash('success', 'Testimonial added successfully');
    res.redirect('/admin/testimonials');
  } catch (error) {
    console.error('Testimonial creation error:', error);
    req.flash('error', 'Failed to add testimonial');
    res.redirect('/admin/testimonials');
  }
});

// Edit testimonial
router.post('/testimonials/edit/:id', isAdmin, async (req, res) => {
  try {
    const testimonial = await Content.findByPk(req.params.id);
    if (!testimonial) {
      req.flash('error', 'Testimonial not found');
      return res.redirect('/admin/testimonials');
    }

    await testimonial.update({
      title: req.body.title,
      content: req.body.content,
      company: req.body.company || null,
      position: req.body.position || null,
      image: req.body.image || null,
      rating: req.body.rating || 5,
      featured: req.body.featured === 'true' || req.body.featured === 'on'
    });

    req.flash('success', 'Testimonial updated successfully');
    res.redirect('/admin/testimonials');
  } catch (error) {
    console.error('Testimonial edit error:', error);
    req.flash('error', 'Failed to update testimonial');
    res.redirect('/admin/testimonials');
  }
});

// Get single testimonial (for AJAX)
router.get('/testimonials/:id', isAdmin, async (req, res) => {
  try {
    const testimonial = await Content.findByPk(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    res.json({
      success: true,
      testimonial: {
        id: testimonial.id,
        title: testimonial.title,
        content: testimonial.content,
        company: testimonial.company,
        position: testimonial.position,
        image: testimonial.image,
        rating: testimonial.rating,
        featured: testimonial.featured
      }
    });
  } catch (error) {
    console.error('Testimonial fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch testimonial' });
  }
});

// Delete testimonial
router.post('/testimonials/delete/:id', isAdmin, async (req, res) => {
  try {
    const testimonial = await Content.findByPk(req.params.id);
    if (!testimonial) {
      req.flash('error', 'Testimonial not found');
      return res.redirect('/admin/testimonials');
    }

    await testimonial.destroy();
    req.flash('success', 'Testimonial deleted successfully');
    res.redirect('/admin/testimonials');
  } catch (error) {
    console.error('Testimonial deletion error:', error);
    req.flash('error', 'Failed to delete testimonial');
    res.redirect('/admin/testimonials');
  }
});

// Projects management
router.get('/projects', isAdmin, async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/projects', {
      title: 'Manage Projects - Admin',
      projects
    });
  } catch (error) {
    console.error('Projects management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load projects' });
  }
});

// Add project
router.post('/projects', isAdmin, async (req, res) => {
  try {
    const { title, category, location, capacity, description, client, status, featured } = req.body;
    let imagePaths = [];

    // Handle multiple file uploads
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

      for (const imageFile of imageFiles) {
        const imageName = `project-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
        const imageFullPath = path.join(uploadsDir, imageName);

        // Validate image file type
        if (!imageFile.mimetype.startsWith('image/')) {
          req.flash('error', 'Only image files are allowed');
          return res.redirect('/admin/projects');
        }

        // Move image file
        await imageFile.mv(imageFullPath);
        imagePaths.push('/uploads/' + imageName);
      }
    }

    await Project.create({
      title,
      category,
      location: location || null,
      capacity: capacity || null,
      description: description || null,
      client: client || null,
      status: status || 'completed',
      images: imagePaths,
      featured: featured === 'true' || featured === 'on',
      userId: req.user.id
    });

    req.flash('success', 'Project added successfully');
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Project creation error:', error);
    req.flash('error', 'Failed to add project');
    res.redirect('/admin/projects');
  }
});

// Edit project
router.post('/projects/edit/:id', isAdmin, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      req.flash('error', 'Project not found');
      return res.redirect('/admin/projects');
    }

    const { title, category, location, capacity, description, client, status, images, featured } = req.body;
    let imagePath = project.images; // Keep existing image if no new one uploaded

    // Handle file upload
    if (req.files && req.files.images) {
      const imageFile = req.files.images;
      const imageName = `project-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
      const imageFullPath = path.join(uploadsDir, imageName);

      // Validate image file type
      if (!imageFile.mimetype.startsWith('image/')) {
        req.flash('error', 'Only image files are allowed');
        return res.redirect('/admin/projects');
      }

      // Move image file
      await imageFile.mv(imageFullPath);
      imagePath = '/uploads/' + imageName;
    }

    await project.update({
      title,
      category,
      location: location || null,
      capacity: capacity || null,
      description: description || null,
      client: client || null,
      status: status || 'completed',
      images: imagePath,
      featured: featured === 'true' || featured === 'on'
    });

    req.flash('success', 'Project updated successfully');
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Project edit error:', error);
    req.flash('error', 'Failed to update project');
    res.redirect('/admin/projects');
  }
});

// Delete project
router.post('/projects/delete/:id', isAdmin, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      req.flash('error', 'Project not found');
      return res.redirect('/admin/projects');
    }

    await project.destroy();
    req.flash('success', 'Project deleted successfully');
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Project deletion error:', error);
    req.flash('error', 'Failed to delete project');
    res.redirect('/admin/projects');
  }
});

// News management
router.get('/news', isAdmin, async (req, res) => {
  try {
    const news = await News.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/news', {
      title: 'Manage News - Admin',
      news
    });
  } catch (error) {
    console.error('News management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load news' });
  }
});

// Get single news item (for AJAX)
router.get('/news/:id', isAdmin, async (req, res) => {
  try {
    const newsItem = await News.findByPk(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ success: false, message: 'News item not found' });
    }

    res.json({
      success: true,
      news: {
        id: newsItem.id,
        title: newsItem.title,
        slug: newsItem.slug,
        excerpt: newsItem.excerpt,
        content: newsItem.content,
        category: newsItem.category,
        featuredImage: newsItem.featuredImage,
        images: newsItem.images,
        tags: newsItem.tags,
        author: newsItem.author,
        published: newsItem.published,
        seoTitle: newsItem.seoTitle,
        seoDescription: newsItem.seoDescription,
        seoKeywords: newsItem.seoKeywords
      }
    });
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch news item' });
  }
});

// Add news
router.post('/news', isAdmin, async (req, res) => {
  try {
    const { title, slug, excerpt, content, category, featuredImage, tags, author, published, seoTitle, seoDescription, seoKeywords } = req.body;
    let imagePath = null;
    let additionalImages = [];

    // Handle file uploads
    if (req.files) {
      // Handle featured image
      if (req.files.featuredImage) {
        const imageFile = req.files.featuredImage;
        const imageName = `news-featured-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
        const imageFullPath = path.join(uploadsDir, imageName);

        // Validate image file type
        if (!imageFile.mimetype.startsWith('image/')) {
          req.flash('error', 'Only image files are allowed');
          return res.redirect('/admin/news');
        }

        // Move image file
        await imageFile.mv(imageFullPath);
        imagePath = '/uploads/' + imageName;
      }

      // Handle additional images
      if (req.files.images) {
        const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const file of imageFiles) {
          const imageName = `news-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.name)}`;
          const imageFullPath = path.join(uploadsDir, imageName);

          // Validate image file type
          if (!file.mimetype.startsWith('image/')) {
            req.flash('error', 'Only image files are allowed');
            return res.redirect('/admin/news');
          }

          // Move image file
          await file.mv(imageFullPath);
          additionalImages.push('/uploads/' + imageName);
        }
      }
    }

    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
      } catch (error) {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    await News.create({
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      excerpt: excerpt || null,
      content,
      category,
      featuredImage: imagePath,
      images: additionalImages,
      tags: parsedTags,
      author: author || null,
      published: published === 'true' || published === 'on',
      publishedAt: published ? new Date() : null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      userId: req.user.id
    });

    req.flash('success', 'News article added successfully');
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News creation error:', error);
    req.flash('error', 'Failed to add news article');
    res.redirect('/admin/news');
  }
});

// Edit news
router.post('/news/edit/:id', isAdmin, async (req, res) => {
  try {
    const newsItem = await News.findByPk(req.params.id);
    if (!newsItem) {
      req.flash('error', 'News article not found');
      return res.redirect('/admin/news');
    }

    const { title, slug, excerpt, content, category, tags, author, published, seoTitle, seoDescription, seoKeywords } = req.body;
    let featuredImagePath = newsItem.featuredImage; // Keep existing image if no new one uploaded
    let additionalImages = newsItem.images || [];

    // Handle file uploads
    if (req.files) {
      // Handle featured image
      if (req.files.featuredImage) {
        const imageFile = req.files.featuredImage;
        const imageName = `news-featured-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
        const imageFullPath = path.join(uploadsDir, imageName);

        // Validate image file type
        if (!imageFile.mimetype.startsWith('image/')) {
          req.flash('error', 'Only image files are allowed');
          return res.redirect('/admin/news');
        }

        // Move image file
        await imageFile.mv(imageFullPath);
        featuredImagePath = '/uploads/' + imageName;
      }

      // Handle additional images
      if (req.files.images) {
        const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const file of imageFiles) {
          const imageName = `news-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.name)}`;
          const imageFullPath = path.join(uploadsDir, imageName);

          // Validate image file type
          if (!file.mimetype.startsWith('image/')) {
            req.flash('error', 'Only image files are allowed');
            return res.redirect('/admin/news');
          }

          // Move image file
          await file.mv(imageFullPath);
          additionalImages.push('/uploads/' + imageName);
        }
      }
    }

    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
      } catch (error) {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    await newsItem.update({
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      excerpt: excerpt || null,
      content,
      category,
      featuredImage: featuredImagePath,
      images: additionalImages,
      tags: parsedTags,
      author: author || null,
      published: published === 'true' || published === 'on',
      publishedAt: published ? new Date() : null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null
    });

    req.flash('success', 'News article updated successfully');
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News edit error:', error);
    req.flash('error', 'Failed to update news article');
    res.redirect('/admin/news');
  }
});

// Delete news
router.post('/news/delete/:id', isAdmin, async (req, res) => {
  try {
    const newsItem = await News.findByPk(req.params.id);
    if (!newsItem) {
      req.flash('error', 'News article not found');
      return res.redirect('/admin/news');
    }

    await newsItem.destroy();
    req.flash('success', 'News article deleted successfully');
    res.redirect('/admin/news');
  } catch (error) {
    console.error('News deletion error:', error);
    req.flash('error', 'Failed to delete news article');
    res.redirect('/admin/news');
  }
});

// Enquiries management
router.get('/enquiries', isAdmin, async (req, res) => {
  try {
    const enquiries = await Enquiry.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/enquiries', {
      title: 'Manage Enquiries - Admin',
      enquiries
    });
  } catch (error) {
    console.error('Enquiries management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load enquiries' });
  }
});

// Content management
router.get('/content', isAdmin, async (req, res) => {
  try {
    const content = await Content.findAll({
      where: { type: { [Op.ne]: 'group' } },
      order: [['type', 'ASC'], ['createdAt', 'DESC']]
    });

    const groupContent = await Content.findAll({
      where: { type: 'group' },
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/content', {
      title: 'Manage Content - Admin',
      content,
      groupContent
    });
  } catch (error) {
    console.error('Content management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load content' });
  }
});

// Add content
router.post('/content', isAdmin, async (req, res) => {
  try {
    const { type, title, content, company, position, rating, featured } = req.body;
    let imagePath = null;

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const imageName = `content-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
      const imageFullPath = path.join(uploadsDir, imageName);

      // Validate image file type
      if (!imageFile.mimetype.startsWith('image/')) {
        req.flash('error', 'Only image files are allowed');
        return res.redirect('/admin/content');
      }

      // Move image file
      await imageFile.mv(imageFullPath);
      imagePath = '/uploads/' + imageName;
    }

    // Set page and section based on type
    let page = 'home';
    let section = type;
    if (type === 'testimonial') {
      page = 'about';
      section = 'testimonials';
    } else if (type === 'service') {
      page = 'services';
      section = 'services';
    } else if (type === 'project') {
      page = 'projects';
      section = 'projects';
    } else if (type === 'news') {
      page = 'news';
      section = 'news';
    }

    await Content.create({
      type,
      page,
      section,
      title: title || null,
      content,
      image: imagePath,
      company: company || null,
      position: position || null,
      rating: rating || null,
      featured: featured === 'true' || featured === 'on',
      userId: req.user.id
    });

    req.flash('success', 'Content added successfully');
    res.redirect('/admin/content');
  } catch (error) {
    console.error('Content creation error:', error);
    req.flash('error', 'Failed to add content');
    res.redirect('/admin/content');
  }
});

// Edit content
router.post('/content/edit/:id', isAdmin, async (req, res) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      req.flash('error', 'Content not found');
      return res.redirect('/admin/content');
    }

    await content.update({
      type: req.body.type,
      title: req.body.title || null,
      content: req.body.content
    });

    req.flash('success', 'Content updated successfully');
    res.redirect('/admin/content');
  } catch (error) {
    console.error('Content edit error:', error);
    req.flash('error', 'Failed to update content');
    res.redirect('/admin/content');
  }
});

// Delete content
router.post('/content/delete/:id', isAdmin, async (req, res) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) {
      req.flash('error', 'Content not found');
      return res.redirect('/admin/content');
    }

    await content.destroy();
    req.flash('success', 'Content deleted successfully');
    res.redirect('/admin/content');
  } catch (error) {
    console.error('Content deletion error:', error);
    req.flash('error', 'Failed to delete content');
    res.redirect('/admin/content');
  }
});

// Team management
router.get('/team', isAdmin, async (req, res) => {
  try {
    const team = await Content.findAll({
      where: { type: 'team' },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.render('admin/team', {
      title: 'Manage Team - Admin',
      team
    });
  } catch (error) {
    console.error('Team management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load team' });
  }
});

// Add team member
router.post('/team', isAdmin, async (req, res) => {
  try {
    const { title, subtitle, content, linkedin, twitter, email, order } = req.body;
    let imagePath = null;

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const imageName = `team-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
      const imageFullPath = path.join(uploadsDir, imageName);

      // Validate image file type
      if (!imageFile.mimetype.startsWith('image/')) {
        req.flash('error', 'Only image files are allowed');
        return res.redirect('/admin/team');
      }

      // Move image file
      await imageFile.mv(imageFullPath);
      imagePath = '/uploads/' + imageName;
    }

    // Prepare metadata for social links
    const metadata = {};
    if (linkedin || twitter || email) {
      metadata.social = {};
      if (linkedin) metadata.social.linkedin = linkedin;
      if (twitter) metadata.social.twitter = twitter;
      if (email) metadata.social.email = email;
    }

    await Content.create({
      type: 'team',
      page: 'team',
      section: 'team-member',
      title,
      subtitle: subtitle || null,
      content: content || null,
      image: imagePath,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      order: order || 0,
      userId: req.user.id
    });

    req.flash('success', 'Team member added successfully');
    res.redirect('/admin/team');
  } catch (error) {
    console.error('Team member creation error:', error);
    req.flash('error', 'Failed to add team member');
    res.redirect('/admin/team');
  }
});

// Get single team member (for AJAX)
router.get('/team/:id', isAdmin, async (req, res) => {
  try {
    const teamMember = await Content.findByPk(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    res.json({
      success: true,
      teamMember: {
        id: teamMember.id,
        title: teamMember.title,
        subtitle: teamMember.subtitle,
        content: teamMember.content,
        image: teamMember.image,
        order: teamMember.order,
        linkedin: teamMember.metadata?.social?.linkedin || '',
        twitter: teamMember.metadata?.social?.twitter || '',
        email: teamMember.metadata?.social?.email || ''
      }
    });
  } catch (error) {
    console.error('Team member fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch team member' });
  }
});

// Edit team member
router.post('/team/edit/:id', isAdmin, async (req, res) => {
  try {
    const teamMember = await Content.findByPk(req.params.id);
    if (!teamMember) {
      req.flash('error', 'Team member not found');
      return res.redirect('/admin/team');
    }

    const { title, subtitle, content, linkedin, twitter, email, order } = req.body;
    let imagePath = teamMember.image; // Keep existing image if no new one uploaded

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const imageName = `team-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
      const imageFullPath = path.join(uploadsDir, imageName);

      // Validate image file type
      if (!imageFile.mimetype.startsWith('image/')) {
        req.flash('error', 'Only image files are allowed');
        return res.redirect('/admin/team');
      }

      // Move image file
      await imageFile.mv(imageFullPath);
      imagePath = '/uploads/' + imageName;
    }

    // Prepare metadata for social links
    const metadata = {};
    if (linkedin || twitter || email) {
      metadata.social = {};
      if (linkedin) metadata.social.linkedin = linkedin;
      if (twitter) metadata.social.twitter = twitter;
      if (email) metadata.social.email = email;
    }

    await teamMember.update({
      title,
      subtitle: subtitle || null,
      content: content || null,
      image: imagePath,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      order: order || 0
    });

    req.flash('success', 'Team member updated successfully');
    res.redirect('/admin/team');
  } catch (error) {
    console.error('Team member edit error:', error);
    req.flash('error', 'Failed to update team member');
    res.redirect('/admin/team');
  }
});

// Delete team member
router.post('/team/delete/:id', isAdmin, async (req, res) => {
  try {
    const teamMember = await Content.findByPk(req.params.id);
    if (!teamMember) {
      req.flash('error', 'Team member not found');
      return res.redirect('/admin/team');
    }

    await teamMember.destroy();
    req.flash('success', 'Team member deleted successfully');
    res.redirect('/admin/team');
  } catch (error) {
    console.error('Team member deletion error:', error);
    req.flash('error', 'Failed to delete team member');
    res.redirect('/admin/team');
  }
});



// Our Partners management
router.get('/our-partners', isAdmin, async (req, res) => {
  try {
    const partnersContent = await Content.findAll({
      where: { type: 'partners' },
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/our-partners', {
      title: 'Manage Our Partners - Admin',
      partnersContent
    });
  } catch (error) {
    console.error('Our Partners management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load partners content' });
  }
});

// Add partners content
router.post('/our-partners', isAdmin, async (req, res) => {
  try {
    const { title, content, company, featured } = req.body;
    let imagePath = null;

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const imageName = `partners-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
      const imageFullPath = path.join(uploadsDir, imageName);

      // Validate image file type
      if (!imageFile.mimetype.startsWith('image/')) {
        req.flash('error', 'Only image files are allowed');
        return res.redirect('/admin/our-partners');
      }

      // Move image file
      await imageFile.mv(imageFullPath);
      imagePath = '/uploads/' + imageName;
    }

    await Content.create({
      type: 'partners',
      page: 'our-partners',
      section: 'partners',
      title,
      content,
      company: company || null,
      image: imagePath,
      featured: featured === 'true' || featured === 'on',
      userId: req.user.id
    });

    req.flash('success', 'Partner content added successfully');
    res.redirect('/admin/our-partners');
  } catch (error) {
    console.error('Partner content creation error:', error);
    req.flash('error', 'Failed to add partner content');
    res.redirect('/admin/our-partners');
  }
});

// Edit partners content
router.post('/our-partners/edit/:id', isAdmin, async (req, res) => {
  try {
    const partnerItem = await Content.findByPk(req.params.id);
    if (!partnerItem) {
      req.flash('error', 'Partner content not found');
      return res.redirect('/admin/our-partners');
    }

    await partnerItem.update({
      title: req.body.title,
      content: req.body.content,
      company: req.body.company || null,
      featured: req.body.featured === 'true' || req.body.featured === 'on'
    });

    req.flash('success', 'Partner content updated successfully');
    res.redirect('/admin/our-partners');
  } catch (error) {
    console.error('Partner content edit error:', error);
    req.flash('error', 'Failed to update partner content');
    res.redirect('/admin/our-partners');
  }
});

// Delete partners content
router.post('/our-partners/delete/:id', isAdmin, async (req, res) => {
  try {
    const partnerItem = await Content.findByPk(req.params.id);
    if (!partnerItem) {
      req.flash('error', 'Partner content not found');
      return res.redirect('/admin/our-partners');
    }

    await partnerItem.destroy();
    req.flash('success', 'Partner content deleted successfully');
    res.redirect('/admin/our-partners');
  } catch (error) {
    console.error('Partner content deletion error:', error);
    req.flash('error', 'Failed to delete partner content');
    res.redirect('/admin/our-partners');
  }
});

// Awards & Recognition management
router.get('/awards-recognition', isAdmin, async (req, res) => {
  try {
    const awardsContent = await Content.findAll({
      where: { type: 'awards' },
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/awards-recognition', {
      title: 'Manage Awards & Recognition - Admin',
      awardsContent
    });
  } catch (error) {
    console.error('Awards & Recognition management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load awards content' });
  }
});

// Add awards content
router.post('/awards-recognition', isAdmin, async (req, res) => {
  try {
    const { title, content, company, featured } = req.body;
    let imagePath = null;

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const imageName = `awards-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
      const imageFullPath = path.join(uploadsDir, imageName);

      // Validate image file type
      if (!imageFile.mimetype.startsWith('image/')) {
        req.flash('error', 'Only image files are allowed');
        return res.redirect('/admin/awards-recognition');
      }

      // Move image file
      await imageFile.mv(imageFullPath);
      imagePath = '/uploads/' + imageName;
    }

    await Content.create({
      type: 'awards',
      page: 'awards-recognition',
      section: 'awards',
      title,
      content,
      company: company || null,
      image: imagePath,
      featured: featured === 'true' || featured === 'on',
      userId: req.user.id
    });

    req.flash('success', 'Award content added successfully');
    res.redirect('/admin/awards-recognition');
  } catch (error) {
    console.error('Award content creation error:', error);
    req.flash('error', 'Failed to add award content');
    res.redirect('/admin/awards-recognition');
  }
});

// Edit awards content
router.post('/awards-recognition/edit/:id', isAdmin, async (req, res) => {
  try {
    const awardItem = await Content.findByPk(req.params.id);
    if (!awardItem) {
      req.flash('error', 'Award content not found');
      return res.redirect('/admin/awards-recognition');
    }

    await awardItem.update({
      title: req.body.title,
      content: req.body.content,
      company: req.body.company || null,
      featured: req.body.featured === 'true' || req.body.featured === 'on'
    });

    req.flash('success', 'Award content updated successfully');
    res.redirect('/admin/awards-recognition');
  } catch (error) {
    console.error('Award content edit error:', error);
    req.flash('error', 'Failed to update award content');
    res.redirect('/admin/awards-recognition');
  }
});

// Delete awards content
router.post('/awards-recognition/delete/:id', isAdmin, async (req, res) => {
  try {
    const awardItem = await Content.findByPk(req.params.id);
    if (!awardItem) {
      req.flash('error', 'Award content not found');
      return res.redirect('/admin/awards-recognition');
    }

    await awardItem.destroy();
    req.flash('success', 'Award content deleted successfully');
    res.redirect('/admin/awards-recognition');
  } catch (error) {
    console.error('Award content deletion error:', error);
    req.flash('error', 'Failed to delete award content');
    res.redirect('/admin/awards-recognition');
  }
});

// Logo management
router.get('/logos', isAdmin, async (req, res) => {
  try {
    const logos = await Content.findAll({
      where: { type: 'logo' },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.render('admin/logos', {
      title: 'Manage Logos - Admin',
      logos
    });
  } catch (error) {
    console.error('Logos management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load logos' });
  }
});

// Add logo
router.post('/logos', isAdmin, async (req, res) => {
  try {
    const { title, content, order } = req.body;
    let imagePath = null;

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const imageName = `logo-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
      const imageFullPath = path.join(uploadsDir, imageName);

      // Validate image file type
      if (!imageFile.mimetype.startsWith('image/')) {
        req.flash('error', 'Only image files are allowed');
        return res.redirect('/admin/logos');
      }

      // Move image file
      await imageFile.mv(imageFullPath);
      imagePath = '/uploads/' + imageName;
    }

    await Content.create({
      type: 'logo',
      page: 'home',
      section: 'logos-bar',
      title: title || null,
      content: content || null,
      image: imagePath,
      order: order || 0,
      userId: req.user.id
    });

    req.flash('success', 'Logo added successfully');
    res.redirect('/admin/logos');
  } catch (error) {
    console.error('Logo creation error:', error);
    req.flash('error', 'Failed to add logo');
    res.redirect('/admin/logos');
  }
});

// Edit logo
router.post('/logos/edit/:id', isAdmin, async (req, res) => {
  try {
    const logo = await Content.findByPk(req.params.id);
    if (!logo) {
      req.flash('error', 'Logo not found');
      return res.redirect('/admin/logos');
    }

    const { title, content, order } = req.body;
    let imagePath = logo.image; // Keep existing image if no new one uploaded

    // Handle file upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const imageName = `logo-image-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
      const imageFullPath = path.join(uploadsDir, imageName);

      // Validate image file type
      if (!imageFile.mimetype.startsWith('image/')) {
        req.flash('error', 'Only image files are allowed');
        return res.redirect('/admin/logos');
      }

      // Move image file
      await imageFile.mv(imageFullPath);
      imagePath = '/uploads/' + imageName;
    }

    await logo.update({
      title: title || null,
      content: content || null,
      image: imagePath,
      order: order || 0
    });

    req.flash('success', 'Logo updated successfully');
    res.redirect('/admin/logos');
  } catch (error) {
    console.error('Logo edit error:', error);
    req.flash('error', 'Failed to update logo');
    res.redirect('/admin/logos');
  }
});

// Delete logo
router.post('/logos/delete/:id', isAdmin, async (req, res) => {
  try {
    const logo = await Content.findByPk(req.params.id);
    if (!logo) {
      req.flash('error', 'Logo not found');
      return res.redirect('/admin/logos');
    }

    await logo.destroy();
    req.flash('success', 'Logo deleted successfully');
    res.redirect('/admin/logos');
  } catch (error) {
    console.error('Logo deletion error:', error);
    req.flash('error', 'Failed to delete logo');
    res.redirect('/admin/logos');
  }
});

// Settings page
router.get('/settings', isAdmin, (req, res) => {
  res.render('admin/settings', {
    title: 'Settings - Admin'
  });
});

module.exports = router;

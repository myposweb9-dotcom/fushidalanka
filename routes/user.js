const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
const { isAuthenticated, isAdmin, isVendorOrAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Login page
router.get('/login', (req, res) => {
  res.render('user/login', { title: 'Login - FushidaLanka' });
});

// Login POST
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message || 'Invalid credentials');
      return res.redirect('/user/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login session error:', err);
        return next(err);
      }
      req.flash('success', 'Welcome back!');
      // Redirect based on user role
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/user/dashboard');
      }
    });
  })(req, res, next);
});

// Register page
router.get('/register', (req, res) => {
  res.render('user/register', { title: 'Register - FushidaLanka' });
});

// Register POST
router.post('/register', async (req, res) => {
  console.log('Registration route called with body:', req.body);
  console.log('Phone field received:', req.body.phone);
  try {
    const { name, email, phone, password, confirmPassword, role } = req.body;

    // Process phone number - ensure it's in international format
    let processedPhone = phone;
    if (phone && !phone.startsWith('+')) {
      // If phone doesn't start with +, try to add country code
      // This is a fallback for when JavaScript doesn't work
      processedPhone = phone.replace(/^\+?/, '+'); // Ensure it starts with +
    }

    // Validation
    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      req.flash('error', 'Passwords do not match');
      return res.redirect('/user/register');
    }

    if (password.length < 6) {
      console.log('Password too short');
      req.flash('error', 'Password must be at least 6 characters long');
      return res.redirect('/user/register');
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('User already exists');
      req.flash('error', 'Email already registered');
      return res.redirect('/user/register');
    }

    console.log('Creating user with:', { name, email, phone: processedPhone, password: '***', role });
    // Create user (password will be hashed by beforeCreate hook)
    await User.create({
      name,
      email,
      phone: processedPhone,
      password,
      role: role || 'user'
    });

    console.log('User created successfully');
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/user/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Registration failed');
    res.redirect('/user/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    req.flash('success', 'Logged out successfully');
    res.redirect('/');
  });
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
  res.render('user/forgot-password', { title: 'Forgot Password - FushidaLanka' });
});

// Forgot password POST
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      req.flash('error', 'No account with that email address exists');
      return res.redirect('/user/forgot-password');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      resetToken,
      resetTokenExpiry
    });

    // Send email (simplified - in production use proper email service)
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - FushidaLanka',
      html: `
        <p>You requested a password reset for your FushidaLanka account.</p>
        <p>Click this link to reset your password:</p>
        <a href="${process.env.BASE_URL}/user/reset-password/${resetToken}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    req.flash('success', 'Password reset email sent');
    res.redirect('/user/login');
  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error', 'Failed to send reset email');
    res.redirect('/user/forgot-password');
  }
});

// Reset password page
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.render('user/reset-password', { title: 'Reset Password', error: 'Invalid or expired reset token' });
    }

    res.render('user/reset-password', { title: 'Reset Password', token });
  } catch (error) {
    console.error('Reset password page error:', error);
    res.render('user/reset-password', { title: 'Reset Password', error: 'Failed to load reset page' });
  }
});

// Reset password POST
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('user/reset-password', { title: 'Reset Password', error: 'Passwords do not match', token });
    }

    if (password.length < 6) {
      return res.render('user/reset-password', { title: 'Reset Password', error: 'Password must be at least 6 characters long', token });
    }

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.render('user/reset-password', { title: 'Reset Password', error: 'Invalid or expired reset token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token.
    // Using Sequelize model update avoids hardcoding the physical table name (e.g. `users` vs `User`).
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });

    req.flash('success', 'Password reset successful! Please log in with your new password.');
    res.redirect('/user/login');
  } catch (error) {
    console.error('Reset password error:', error);
    res.render('user/reset-password', { title: 'Reset Password', error: 'Failed to reset password', token: req.params.token });
  }
});

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  console.log('Dashboard route accessed by user:', req.user ? req.user.email : 'No user');
  try {
    // FushidaLanka dashboard - company information focused
    const stats = {
      totalProjects: 25,
      completedProjects: 18,
      activeServices: 8,
      customerSatisfaction: 98
    };

    res.render('user/dashboard', {
      title: 'Dashboard - FushidaLanka',
      user: req.user,
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).render('error', {
      title: 'Dashboard Error',
      message: 'Failed to load dashboard',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// User Product Management
router.get('/products', isAuthenticated, async (req, res) => {
  try {
    const whereClause = { userId: req.user.id };

    const products = await Product.findAll({
      where: whereClause,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    res.render('user/products', {
      title: 'My Products',
      user: req.user,
      products,
      categories
    });
  } catch (error) {
    console.error('Products management error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load products' });
  }
});

// Add Product (via form)
router.get('/add-product', isAuthenticated, async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    res.render('user/add-product', {
      title: 'Add Product',
      user: req.user,
      categories
    });
  } catch (error) {
    console.error('Add product page error:', error);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load add product page' });
  }
});

// Update Product
router.post('/products/update/:id', isAuthenticated, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/user/products');
    }

    // Users can only edit their own products
    if (product.userId !== req.user.id) {
      req.flash('error', 'Access denied. You can only edit your own products.');
      return res.redirect('/user/products');
    }

    const { name, description, price, categoryId, stock, minOrder, warranty, whatsappLink } = req.body;

    await product.update({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      categoryId: parseInt(categoryId),
      stock: parseInt(stock) || 0,
      minOrder: parseInt(minOrder) || 1,
      warranty: warranty || null,
      whatsappLink: whatsappLink || null
    });

    req.flash('success', 'Product updated successfully');
    res.redirect('/user/products');
  } catch (error) {
    console.error('Product update error:', error);
    req.flash('error', 'Failed to update product');
    res.redirect('/user/products');
  }
});

// Delete Product
router.post('/products/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/user/products');
    }

    // Users can only delete their own products
    if (product.userId !== req.user.id) {
      req.flash('error', 'Access denied. You can only delete your own products.');
      return res.redirect('/user/products');
    }

    await product.destroy();
    req.flash('success', 'Product deleted successfully');
    res.redirect('/user/products');
  } catch (error) {
    console.error('Product deletion error:', error);
    req.flash('error', 'Failed to delete product');
    res.redirect('/user/products');
  }
});



// Profile page
router.get('/profile', isAuthenticated, (req, res) => {
  res.render('user/profile', { title: 'Profile - FushidaLanka', user: req.user });
});

// Orders page
router.get('/orders', isAuthenticated, (req, res) => {
  res.render('user/orders', { title: 'Orders - FushidaLanka', user: req.user });
});

// Favorites page
router.get('/favorites', isAuthenticated, (req, res) => {
  res.render('user/favorites', { title: 'Favorites - FushidaLanka', user: req.user });
});

// Analytics page
router.get('/analytics', isAuthenticated, (req, res) => {
  res.render('user/analytics', { title: 'Analytics - FushidaLanka', user: req.user });
});



module.exports = router;

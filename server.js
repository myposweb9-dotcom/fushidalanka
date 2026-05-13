require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');

// Import database and models
const { sequelize, testConnection } = require('./config/database');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Project = require('./models/Project');
const Content = require('./models/Content');
const News = require('./models/News');
const Enquiry = require('./models/Enquiry');

// Import authentication middleware
const { passport, isAuthenticated, isAdmin, isVendorOrAdmin } = require('./middleware/auth');

// Define associations after all models are imported
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

Product.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });

const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection and sync models
async function initializeDatabase() {
  try {
    await testConnection();
    await sequelize.sync({ force: false }); // Don't force sync - preserve data
    console.log('Database synchronized successfully.');

    // Create default admin user if not exists
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const adminExists = await User.findOne({ where: { email: process.env.ADMIN_EMAIL } });
      if (!adminExists) {
        await User.create({
          name: 'Admin User',
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          role: 'admin'
        });
        console.log('Default admin user created.');
      }
    } else {
      console.log('Admin credentials not provided in environment variables. Skipping admin user creation.');
    }

    // Seed logos if none exist
    const logoCount = await Content.count({ where: { type: 'logo' } });
    if (logoCount === 0) {
      console.log('Seeding Logobar logos...');
      const logobarLogos = [
        {
          title: 'Jinko Solar',
          image: '/uploads/Logobar/Jinko_Solar_logo.svg.png',
          type: 'logo',
          section: 'partners',
          order: 1
        },
        {
          title: 'Trina Solar',
          image: '/uploads/Logobar/trina-solar-logo-png_seeklogo-434428-removebg-preview.png',
          type: 'logo',
          section: 'partners',
          order: 2
        },
        {
          title: 'Projoy Electric',
          image: '/uploads/Logobar/projoy_electric_logo-removebg-preview.png',
          type: 'logo',
          section: 'partners',
          order: 3
        },
        {
          title: 'KBE Berlin',
          image: '/uploads/Logobar/kbe_berlin8-removebg-preview.png',
          type: 'logo',
          section: 'partners',
          order: 4
        },
        {
          title: 'Longi Solar',
          image: '/uploads/Logobar/png-clipart-solar-panels-xi-an-longi-silicon-materials-solar-power-monocrystalline-silicon-monocrystalline-silicon.png',
          type: 'logo',
          section: 'partners',
          order: 5
        },
        {
          title: 'Solar Partner',
          image: '/uploads/Logobar/file-removebg-preview (1).png',
          type: 'logo',
          section: 'partners',
          order: 6
        },
        {
          title: 'Solar Partner 2',
          image: '/uploads/Logobar/images__3_-removebg-preview.png',
          type: 'logo',
          section: 'partners',
          order: 7
        }
      ];

      for (const logo of logobarLogos) {
        await Content.create(logo);
      }
      console.log('Logobar logos seeded successfully.');
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// File upload middleware (must come before body parsers)
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }, // 10MB default
  abortOnLimit: true,
  createParentPath: true
}));

// Body parsing middleware (after file upload)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-me',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: isProduction, // true in production (HTTPS), false in dev (HTTP)
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Global variables for templates
app.use(async (req, res, next) => {
  try {
    console.log('Global middleware called for path:', req.path);
    res.locals.user = req.user;
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.currentPath = req.path;

    // Fetch logos for templates
    try {
      const logos = await Content.findAll({
        where: { type: 'logo' },
        order: [['order', 'ASC']]
      });
      res.locals.logos = logos;
      console.log(`Fetched ${logos.length} logos for templates:`, logos.map(l => ({ title: l.title, image: l.image })));
    } catch (error) {
      console.error('Error fetching logos:', error);
      res.locals.logos = [];
    }
    console.log('Global middleware completed successfully');

    next();
  } catch (error) {
    console.error('Error in global middleware:', error);
    next(error);
  }
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
console.log('Loading routes...');
try {
  const indexRoutes = require('./routes/index');
  console.log('Index routes loaded:', typeof indexRoutes);
  app.use('/', indexRoutes);
  console.log('Routes mounted successfully');
} catch (error) {
  console.error('Error loading routes:', error);
  process.exit(1);
}

// Admin Page Rendering Routes (for EJS templates)
app.use('/admin', require('./routes/admin'));

// Admin Data API Routes (for fetching JSON data in admin panel) - SECURED
app.use('/api/admin/categories', require('./routes/categories'));
app.use('/api/admin/products', require('./routes/products'));

// Static files - AFTER routes so routes take precedence
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use('/user', require('./routes/user'));
app.use('/api', require('./routes/api'));
console.log('All routes loaded successfully');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Start server
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();

module.exports = app;

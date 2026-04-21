const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

// Configure Passport Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return done(null, false, { message: 'Account is deactivated' });
    }

    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user with ID:', id);
    const user = await User.findByPk(id);
    if (user) {
      console.log('User found:', user.email);
      done(null, user);
    } else {
      console.log('User not found for ID:', id);
      done(null, false);
    }
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error);
  }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Please log in to access this page');
  res.redirect('/user/login');
};

// Middleware to check if user is authenticated for API calls
const isAuthenticatedAPI = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin' && req.user.isActive) {
    return next();
  }

  // Check if it's an AJAX request
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return res.status(401).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }

  req.flash('error', 'Access denied. Admin privileges required.');
  res.redirect('/admin/login');
};

// Middleware to check if user is vendor or admin
const isVendorOrAdmin = (req, res, next) => {
  if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'vendor')) {
    return next();
  }
  req.flash('error', 'Access denied. Vendor or admin privileges required.');
  res.redirect('/');
};

// Middleware to redirect authenticated users
const redirectIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/user/dashboard');
    }
  }
  next();
};

module.exports = {
  passport,
  isAuthenticated,
  isAuthenticatedAPI,
  isAdmin,
  isVendorOrAdmin,
  redirectIfAuthenticated
};

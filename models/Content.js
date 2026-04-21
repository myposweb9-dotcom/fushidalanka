const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM(
      'about',
      'service',
      'testimonial',
      'hero',
      'mission',
      'team',
      'project',
      'news',
      'career',
      'csr',
      'partner',
      'award',
      'logo'
    ),
    allowNull: false
  },
  page: {
    type: DataTypes.ENUM(
      'about',
      'services',
      'solar-solutions',
      'projects',
      'news',
      'careers',
      'csr',
      'partners',
      'awards'
    ),
    allowNull: true
  },
  section: {
    type: DataTypes.STRING, // e.g., 'hero', 'mission', 'team', etc.
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING, // Image URL or path
    allowNull: true
  },
  images: {
    type: DataTypes.JSON, // Array of images for galleries
    allowNull: true,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON, // Additional data like links, buttons, etc.
    allowNull: true,
    defaultValue: {}
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'contents',
  indexes: [
    {
      unique: true,
      fields: ['page', 'section']
    }
  ]
});

module.exports = Content;

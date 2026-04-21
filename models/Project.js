const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM(
      'utility-scale',
      'ground-mounted',
      'rooftop',
      'industrial',
      'floating',
      'commercial',
      'residential'
    ),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  capacity: {
    type: DataTypes.STRING, // e.g., "5 MW", "100 kW"
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('completed', 'ongoing', 'planned'),
    defaultValue: 'completed'
  },
  completionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON, // Array of image URLs
    allowNull: true,
    defaultValue: []
  },
  client: {
    type: DataTypes.STRING,
    allowNull: true
  },
  technologies: {
    type: DataTypes.JSON, // Array of technologies used
    allowNull: true,
    defaultValue: []
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
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
  tableName: 'projects'
});

module.exports = Project;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.cjs');

const HistorialTarea = sequelize.define('HistorialTarea', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING, // 
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  comment: {
    type: DataTypes.TEXT, 
    allowNull: true
  },
  status: {
    type: DataTypes.STRING, 
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT 
  }
}, {
  timestamps: true 
});

module.exports = HistorialTarea;
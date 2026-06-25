const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  action: {
    type: DataTypes.STRING, // 'Seguir cuenta', 'Reaccionar a un post', etc.
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING, // 'Éxito', 'Error', 'Omitido'
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT // El mensaje que retorna Appium
  }
}, {
  timestamps: true // Esto crea automáticamente campos "createdAt" y "updatedAt"
});

module.exports = HistorialTarea;
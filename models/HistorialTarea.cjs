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
    type: DataTypes.STRING, // 'Seguir cuenta', 'Reaccionar a un post', 'Comentar en un post'
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  comment: {
    type: DataTypes.TEXT, // Almacena el comentario en caso de que aplique
    allowNull: true
  },
  status: {
    type: DataTypes.STRING, // 'En cola', 'Ejecutando', 'Éxito', 'Error', 'Cancelado'
    allowNull: false
  },
  mensaje: {
    type: DataTypes.TEXT // Guarda el retorno exitoso o el mensaje del error
  }
}, {
  timestamps: true // Crea automáticamente las columnas 'createdAt' y 'updatedAt'
});

module.exports = HistorialTarea;
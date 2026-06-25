// backend/config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Crea el archivo "autocontrol.sqlite" en la raíz del backend automáticamente
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../autocontrol.sqlite'),
  logging: false // Cambia a console.log si quieres ver las consultas SQL en la terminal
});

module.exports = sequelize;
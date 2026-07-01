const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.cjs'); // Importamos tu conexión a la BD

const Dispositivo = sequelize.define('Dispositivo', {
    udid: {
        type: DataTypes.STRING,
        primaryKey: true, // El ID único del celular será su código UDID
        allowNull: false
    },
    name: {
        type: DataTypes.STRING, // El nombre que Appium/ADB le da por defecto
        allowNull: false
    },
    customName: {
        type: DataTypes.STRING, // El nombre personalizado que le dará el usuario
        allowNull: true,
        defaultValue: ""
    }
}, {
    timestamps: true // Crea automáticamente las columnas 'createdAt' y 'updatedAt'
});

module.exports = Dispositivo;
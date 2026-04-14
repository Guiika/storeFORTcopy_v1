import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Product from './Product.js';

const Favorite = sequelize.define('Favorite', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
}, { timestamps: true });

// Связи
Favorite.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Favorite, { foreignKey: 'userId' });

Favorite.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Favorite, { foreignKey: 'productId' });

export default Favorite;

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status: { type: DataTypes.ENUM('pending', 'paid', 'shipped'), defaultValue: 'pending' },
  total: { type: DataTypes.FLOAT, defaultValue: 0 }
}, { timestamps: true });

// Связь Order -> User
Order.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Order, { foreignKey: 'userId' });

export default Order;

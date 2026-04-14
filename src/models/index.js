import sequelize from '../config/database.js';
import User from './User.js';
import Category from './Category.js';
import Product from './Product.js';
import Cart from './Cart.js';
import CartItem from './CartItem.js';
import Favorite from './Favorite.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';

// Опционально: здесь можно собрать все связи (если они не объявлены в самих моделях)

const db = {
  sequelize,
  User,
  Category,
  Product,
  Cart,
  CartItem,
  Favorite,
  Order,
  OrderItem
};

export default db;

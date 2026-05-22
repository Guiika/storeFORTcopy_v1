const Order = require('../models/Order');
const Cart = require('../models/Cart');

class OrderController {
    // POST /orders — создать заказ
    static async createOrder(req, res) {
        try {
            const userId = req.userId;
            const { items, total_price, promo_code, discount_percent, first_name, last_name, email, phone, delivery_address } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Корзина пуста' });
            }
            if (!first_name || !last_name || !email || !phone) {
                return res.status(400).json({ error: 'Заполните все данные заказа' });
            }
            if (!delivery_address?.city || !delivery_address?.street || !delivery_address?.house || !delivery_address?.zip) {
                return res.status(400).json({ error: 'Заполните все обязательные поля адреса доставки' });
            }

            const order = await Order.create({
                user_id: userId,
                items,
                total_price,
                promo_code,
                discount_percent,
                first_name,
                last_name,
                email,
                phone,
                delivery_address,
            });

            // Очищаем корзину
            await Cart.clearCart(userId);

            res.status(201).json({ message: 'Заказ оформлен', order });
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({ error: 'Не удалось создать заказ' });
        }
    }

    // GET /orders — все заказы (админ)
    static async getAllOrders(req, res) {
        try {
            const orders = await Order.getAll({ status: req.query.status || '' });
            res.json({ orders });
        } catch (error) {
            console.error('Get all orders error:', error);
            res.status(500).json({ error: 'Не удалось получить заказы' });
        }
    }

    // GET /orders/my — заказы текущего пользователя
    static async getMyOrders(req, res) {
        try {
            const orders = await Order.getUserOrders(req.userId);
            res.json({ orders });
        } catch (error) {
            console.error('Get my orders error:', error);
            res.status(500).json({ error: 'Не удалось получить заказы' });
        }
    }

    // PATCH /orders/:id/status — сменить статус (админ)
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const order = await Order.updateStatus(id, status);
            res.json({ message: 'Статус обновлён', order });
        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({ error: 'Не удалось обновить статус' });
        }
    }
}

module.exports = OrderController;

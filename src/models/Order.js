const db = require('../config/database');

class Order {
    static async create({ user_id, items, total_price, promo_code, discount_percent, first_name, last_name, email, phone, delivery_address }) {
        const result = await db.run(
            `INSERT INTO orders (user_id, status, total_price, promo_code, discount_percent, first_name, last_name, email, phone, delivery_address)
             VALUES (?, 'новый', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, total_price, promo_code || null, discount_percent || 0,
             first_name, last_name, email, phone,
             delivery_address ? JSON.stringify(delivery_address) : null]
        );
        const orderId = result.id;

        for (const item of items) {
            await db.run(
                `INSERT INTO order_items (order_id, product_id, name, brand, size, color, quantity, price)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderId, item.product_id || null, item.name, item.brand || null,
                 item.size || null, item.color || null, item.quantity, item.price]
            );
        }

        return this.findById(orderId);
    }

    static _parse(order) {
        if (!order) return null;
        if (order.delivery_address) {
            try { order.delivery_address = JSON.parse(order.delivery_address); } catch { /* keep as string */ }
        }
        return order;
    }

    static async _fetchItems(orderId) {
        return db.all(`
            SELECT oi.*,
                   (SELECT image_url FROM product_images
                    WHERE product_id = oi.product_id AND is_main = 1 LIMIT 1) AS image_url
            FROM order_items oi
            WHERE oi.order_id = ?
        `, [orderId]);
    }

    static async findById(id) {
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) return null;
        order.items = await this._fetchItems(id);
        return this._parse(order);
    }

    static async getAll({ status } = {}) {
        let query = 'SELECT * FROM orders';
        const params = [];
        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }
        query += ' ORDER BY created_at DESC';
        const orders = await db.all(query, params);
        for (const order of orders) {
            order.items = await this._fetchItems(order.id);
            this._parse(order);
        }
        return orders;
    }

    static async getUserOrders(userId) {
        const orders = await db.all(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        for (const order of orders) {
            order.items = await this._fetchItems(order.id);
            this._parse(order);
        }
        return orders;
    }

    static async updateStatus(id, status) {
        await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        return this.findById(id);
    }
}

module.exports = Order;

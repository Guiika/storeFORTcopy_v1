const User = require('../models/User');

class ProfileController {
    // Получение профиля пользователя
    static async getProfile(req, res) {
        try {
            const userId = req.userId;
            
            // Получаем пользователя из базы
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Формируем ответ с минимальными данными
            res.json({
                profile: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    phone: user.phone || '',
                    full_name: [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Not provided',
                    registered_at: user.created_at
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    }

    // Обновление профиля
    static async updateProfile(req, res) {
        try {
            const userId = req.userId;
            const { first_name, last_name, phone } = req.body;
            
            // Собираем только те поля, которые пришли в запросе
            const updateData = {};
            if (first_name !== undefined) updateData.first_name = first_name.trim();
            if (last_name !== undefined) updateData.last_name = last_name.trim();
            if (phone !== undefined) updateData.phone = phone.trim();
            
            // Проверяем, есть ли что обновлять
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: 'No data to update' });
            }
            
            // Обновляем пользователя
            const updatedUser = await User.update(userId, updateData);
            
            res.json({
                message: 'Profile updated successfully',
                profile: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    first_name: updatedUser.first_name || '',
                    last_name: updatedUser.last_name || '',
                    phone: updatedUser.phone || '',
                    full_name: [updatedUser.first_name, updatedUser.last_name].filter(Boolean).join(' ') || 'Not provided',
                    updated_at: updatedUser.updated_at
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    // Изменение email
    static async updateEmail(req, res) {
        try {
            const userId = req.userId;
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }
            
            // Проверяем пароль
            const user = await User.findByEmail(req.user.email);
            const isValidPassword = await User.verifyPassword(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid password' });
            }
            
            // Проверяем, не занят ли новый email
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({ error: 'Email already in use' });
            }
            
            // Обновляем email
            await User.update(userId, { email });
            
            res.json({
                message: 'Email updated successfully',
                new_email: email
            });
        } catch (error) {
            console.error('Update email error:', error);
            
            if (error.message.includes('UNIQUE constraint')) {
                return res.status(409).json({ error: 'Email already in use' });
            }
            
            res.status(500).json({ error: 'Failed to update email' });
        }
    }

    // Удаление аккаунта (мягкое удаление или полное - по желанию)
    static async deleteAccount(req, res) {
        try {
            const userId = req.userId;
            const { password } = req.body;
            
            if (!password) {
                return res.status(400).json({ error: 'Password is required' });
            }
            
            // Проверяем пароль
            const user = await User.findByEmail(req.user.email);
            const isValidPassword = await User.verifyPassword(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid password' });
            }
            
            // Здесь можно реализовать:
            // 1. Мягкое удаление (пометить аккаунт как deleted)
            // 2. Полное удаление (с очисткой всех данных)
            
            // Пока реализуем мягкое удаление через отдельный метод
            // или просто заглушку
            res.json({ 
                message: 'Account deletion is not implemented in this version',
                note: 'Contact support for account deletion'
            });
            
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({ error: 'Failed to delete account' });
        }
    }

    // Получение статистики активности пользователя
    static async getUserStats(req, res) {
        try {
            const userId = req.userId;
            
            // Получаем статистику из разных источников
            const db = require('../config/database');
            
            const [wishlistCount, cartCount, ordersCount] = await Promise.all([
                // Количество в избранном
                db.get('SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?', [userId]),
                
                // Количество в корзине
                (async () => {
                    const cart = await db.get('SELECT id FROM cart WHERE user_id = ?', [userId]);
                    if (cart) {
                        return db.get(
                            'SELECT SUM(quantity) as count FROM cart_items WHERE cart_id = ?',
                            [cart.id]
                        );
                    }
                    return { count: 0 };
                })(),
                
                // Количество заказов (заглушка, будет реализовано позже)
                Promise.resolve({ count: 0 })
            ]);
            
            res.json({
                stats: {
                    wishlist_items: wishlistCount.count || 0,
                    cart_items: cartCount.count || 0,
                    orders_count: ordersCount.count || 0,
                    member_since: req.user.created_at
                }
            });
        } catch (error) {
            console.error('Get user stats error:', error);
            res.status(500).json({ error: 'Failed to get user statistics' });
        }
    }

    // Проверка доступности email (для валидации на фронтенде)
    static async checkEmailAvailability(req, res) {
        try {
            const { email } = req.query;
            
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            
            const existingUser = await User.findByEmail(email);
            
            res.json({
                email,
                available: !existingUser || existingUser.id === req.userId,
                message: !existingUser ? 'Email is available' : 'Email is already taken'
            });
        } catch (error) {
            console.error('Check email error:', error);
            res.status(500).json({ error: 'Failed to check email availability' });
        }
    }
}

module.exports = ProfileController;
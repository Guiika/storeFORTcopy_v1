const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Создание нового пользователя
    static async create(userData) {
        const { email, password, first_name, last_name, phone, address } = userData;
        
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
            const result = await db.run(
                `INSERT INTO users (email, password, first_name, last_name, phone, address) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [email, hashedPassword, first_name, last_name, phone, address]
            );
            
            return this.findById(result.id);
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('User with this email already exists');
            }
            throw error;
        }
    }

    // Поиск пользователя по ID
    static async findById(id) {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) return null;
        
        // Удаляем пароль из возвращаемого объекта
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Поиск пользователя по email
    static async findByEmail(email) {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        return user;
    }

    // Проверка пароля
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Обновление данных пользователя
    static async update(id, updateData) {
        const allowedFields = ['first_name', 'last_name', 'phone', 'address'];
        const updates = [];
        const values = [];
        
        // Собираем только разрешенные поля
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });
        
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        // Добавляем обновление времени и ID
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        await db.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        return this.findById(id);
    }

    // Изменение пароля
    static async changePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, id]
        );
    }

    // Получение списка пользователей (для администратора)
    static async findAll(limit = 50, offset = 0) {
        const users = await db.all(
            'SELECT id, email, first_name, last_name, role, created_at FROM users LIMIT ? OFFSET ?',
            [limit, offset]
        );
        return users;
    }

    // Проверка, является ли пользователь администратором
    static async isAdmin(userId) {
        const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
        return user && user.role === 'ADMIN';
    }

    // Удаление пользователя (для администратора)
    static async delete(id) {
        await db.run('DELETE FROM users WHERE id = ?', [id]);
        return true;
    }
}

module.exports = User;
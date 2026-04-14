/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

class AuthController {
    // Регистрация пользователя
    static async register(req, res) {
        try {
            const { email, password, first_name, last_name, phone, address } = req.body;
            
            // Проверяем, существует ли пользователь с таким email
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ error: 'User with this email already exists' });
            }

            // Создаем нового пользователя
            const user = await User.create({
                email,
                password,
                first_name,
                last_name,
                phone,
                address
            });

            // Генерируем JWT токен
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                jwtConfig.secret,
                { expiresIn: jwtConfig.expiresIn }
            );

            res.status(201).json({
                message: 'User registered successfully',
                user,
                token
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    // Вход пользователя
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Ищем пользователя по email
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Проверяем пароль
            const isValidPassword = await User.verifyPassword(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Генерируем JWT токен
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                jwtConfig.secret,
                { expiresIn: jwtConfig.expiresIn }
            );

            // Удаляем пароль из ответа
            const { password: _, ...userWithoutPassword } = user;

            res.json({
                message: 'Login successful',
                user: userWithoutPassword,
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    // Получение профиля текущего пользователя
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ user });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    }

    // Обновление профиля
    static async updateProfile(req, res) {
        try {
            const updates = req.body;
            const updatedUser = await User.update(req.userId, updates);
            res.json({
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    // Изменение пароля
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            // Получаем пользователя с паролем
            const user = await User.findByEmail(req.user.email);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Проверяем текущий пароль
            const isValidPassword = await User.verifyPassword(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Меняем пароль
            await User.changePassword(req.userId, newPassword);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    }

    // Валидация токена (для проверки с фронтенда)
    static async validateToken(req, res) {
        try {
            // Если middleware authenticate прошел, токен валиден
            const user = await User.findById(req.userId);
            res.json({
                valid: true,
                user: req.user
            });
        } catch (error) {
            res.status(401).json({ valid: false, error: 'Invalid token' });
        }
    }
}

module.exports = AuthController;
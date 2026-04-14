const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        const dbPath = process.env.DB_PATH || './database/store.db';
        this.db = new sqlite3.Database(path.resolve(dbPath), (err) => {
            if (err) {
                console.error('Database connection error:', err.message);
            } else {
                console.log('Connected to SQLite database');
            }
        });
    }

    // Метод для выполнения SQL запросов
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Метод для получения одной записи
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Метод для получения всех записей
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Инициализация таблиц
    async initializeTables() {
        try {
            // 1. Таблица пользователей
            await this.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    first_name TEXT,
                    last_name TEXT,
                    role TEXT DEFAULT 'USER' CHECK(role IN ('USER', 'ADMIN')),
                    phone TEXT,
                    address TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 2. Таблица категорий
            await this.run(`
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    parent_id INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
                )
            `);
            // 3. ТАБЛИЦА ТОВАРОВ 
            await this.run(`
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    price DECIMAL(10, 2) NOT NULL CHECK(price >= 0),
                    old_price DECIMAL(10, 2) CHECK(old_price >= 0),
                    category_id INTEGER,
                    sku TEXT UNIQUE,
                    stock_quantity INTEGER DEFAULT 0 CHECK(stock_quantity >= 0),
                    is_active BOOLEAN DEFAULT 1,
                    is_featured BOOLEAN DEFAULT 0,
                    weight_kg DECIMAL(5, 2) DEFAULT 0,
                    color TEXT,
                    size TEXT,
                    material TEXT,
                    brand TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                )
            `);

            // Таблица изображений товаров
            await this.run(`
                CREATE TABLE IF NOT EXISTS product_images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    image_url TEXT NOT NULL,
                    is_main BOOLEAN DEFAULT 0,
                    display_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            `);
                    
            await this.run(`
                CREATE TABLE IF NOT EXISTS wishlist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    UNIQUE(user_id, product_id)
                )
            `);

            // ТАБЛИЦА КОРЗИНЫ (НОВАЯ)
            await this.run(`
                CREATE TABLE IF NOT EXISTS cart (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);

            // ТАБЛИЦА ЭЛЕМЕНТОВ КОРЗИНЫ (НОВАЯ)
            await this.run(`
                CREATE TABLE IF NOT EXISTS cart_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cart_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    UNIQUE(cart_id, product_id)
                )
            `);


            // Индексы для оптимизации
            // Для пользователей
            await this.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
            
            // Для категорий
            await this.run('CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active)');

            // Индексы для товаров
            await this.run('CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');

            // Индекс для изображений
            await this.run('CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)');

            // Индексы для wishlist
            await this.run('CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id)');

            // Индексы для корзины
            await this.run('CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id)');
            
            // Создаем тестового администратора (пароль: admin123)
            const adminExists = await this.get("SELECT id FROM users WHERE email = 'admin@store.com'");
            if (!adminExists) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await this.run(
                    "INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)",
                    ['admin@store.com', hashedPassword, 'Admin', 'User', 'ADMIN']
                );
                console.log('Test admin user created: admin@store.com / admin123');
            }

            // Создаем базовые категории для тестов
            const categoriesCount = await this.get("SELECT COUNT(*) as count FROM categories");
            if (categoriesCount.count === 0) {
                await this.run(
                    "INSERT INTO categories (name, description) VALUES (?, ?)",
                    ['Clothing', 'All clothing items']
                );
                
                const clothingId = await this.get("SELECT id FROM categories WHERE name = 'Clothing'");
                
                await this.run(
                    "INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)",
                    ['Men', 'Men\'s clothing', clothingId.id]
                );
                
                await this.run(
                    "INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)",
                    ['Women', 'Women\'s clothing', clothingId.id]
                );
                
                await this.run(
                    "INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)",
                    ['Kids', 'Kids clothing', clothingId.id]
                );
                
                console.log('Test categories created');
            }

            console.log('Database tables initialized successfully');
        } catch (error) {
            console.error('Error initializing database tables:', error);
        }
    }

    // Закрытие соединения
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = new Database();
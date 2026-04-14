const { check, validationResult } = require('express-validator');

// Валидация регистрации
const registerValidator = [
    check('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    check('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage('Password must contain at least one number'),
    
    check('first_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .trim(),
    
    check('last_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .trim(),
    
    check('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
];

// Валидация входа
const loginValidator = [
    check('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    check('password')
        .notEmpty()
        .withMessage('Password is required'),
];

const categoryValidator = [
    check('name')
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters')
        .trim(),
    
    check('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .trim(),
    
    check('parent_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Parent ID must be a positive integer'),
];

const categoryUpdateValidator = [
    check('name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters')
        .trim(),
    
    check('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .trim(),
    
    check('parent_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Parent ID must be a positive integer'),
    
    check('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value'),
];

//  валидаци для товаров
const productValidator = [
    check('name')
        .notEmpty()
        .withMessage('Product name is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Product name must be between 2 and 200 characters')
        .trim(),
    
    check('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters')
        .trim(),
    
    check('price')
        .notEmpty()
        .withMessage('Price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    
    check('old_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Old price must be a positive number'),
    
    check('category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    
    check('sku')
        .optional()
        .isLength({ max: 50 })
        .withMessage('SKU cannot exceed 50 characters')
        .trim(),
    
    check('stock_quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be a non-negative integer'),
    
    check('weight_kg')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Weight must be a positive number'),
    
    check('color')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Color cannot exceed 50 characters')
        .trim(),
    
    check('size')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Size cannot exceed 50 characters')
        .trim(),
    
    check('material')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Material cannot exceed 100 characters')
        .trim(),
    
    check('brand')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Brand cannot exceed 100 characters')
        .trim(),
];

const productUpdateValidator = [
    check('name')
        .optional()
        .isLength({ min: 2, max: 200 })
        .withMessage('Product name must be between 2 and 200 characters')
        .trim(),
    
    check('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters')
        .trim(),
    
    check('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    
    check('old_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Old price must be a positive number'),
    
    check('category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Category ID must be a positive integer'),
    
    check('sku')
        .optional()
        .isLength({ max: 50 })
        .withMessage('SKU cannot exceed 50 characters')
        .trim(),
    
    check('stock_quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be a non-negative integer'),
    
    check('weight_kg')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Weight must be a positive number'),
    
    check('color')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Color cannot exceed 50 characters')
        .trim(),
    
    check('size')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Size cannot exceed 50 characters')
        .trim(),
    
    check('material')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Material cannot exceed 100 characters')
        .trim(),
    
    check('brand')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Brand cannot exceed 100 characters')
        .trim(),
    
    check('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean value'),
    
    check('is_featured')
        .optional()
        .isBoolean()
        .withMessage('is_featured must be a boolean value'),
];

// Добавляем или обновляем валидацию для профиля
const updateProfileValidator = [
    check('first_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .trim()
        .escape(),
    
    check('last_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .trim()
        .escape(),
    
    check('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number')
        .trim(),
];

// Валидация для смены email
const emailUpdateValidator = [
    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    check('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];


// Middleware для обработки ошибок валидации
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    registerValidator,
    loginValidator,
    updateProfileValidator,
    emailUpdateValidator,
    categoryValidator,
    categoryUpdateValidator,
    productValidator,
    productUpdateValidator,
    validate
};
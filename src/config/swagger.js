const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Online Store API',
      version: '1.0.0',
      description: 'Backend API for online clothing store',
      contact: {
        name: 'API Support',
        email: 'support@store.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // Общие схемы
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            phone: { type: 'string' },
            address: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'float' },
            old_price: { type: 'number', format: 'float' },
            category_id: { type: 'integer' },
            sku: { type: 'string' },
            stock_quantity: { type: 'integer' },
            is_active: { type: 'boolean' },
            is_featured: { type: 'boolean' },
            weight_kg: { type: 'number', format: 'float' },
            color: { type: 'string' },
            size: { type: 'string' },
            material: { type: 'string' },
            brand: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            parent_id: { type: 'integer' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            cart_id: { type: 'integer' },
            user_id: { type: 'integer' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  product_id: { type: 'integer' },
                  quantity: { type: 'integer' },
                  name: { type: 'string' },
                  price: { type: 'number' }
                }
              }
            },
            summary: {
              type: 'object',
              properties: {
                items_count: { type: 'integer' },
                subtotal: { type: 'number' },
                total: { type: 'number' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js')
  ]
};

const specs = swaggerJsdoc(options);
module.exports = specs;
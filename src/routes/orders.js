const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticate, isAdmin } = require('../middlewares/auth');

router.post('/', authenticate, OrderController.createOrder);
router.get('/my', authenticate, OrderController.getMyOrders);
router.get('/', authenticate, isAdmin, OrderController.getAllOrders);
router.patch('/:id/status', authenticate, isAdmin, OrderController.updateStatus);

module.exports = router;

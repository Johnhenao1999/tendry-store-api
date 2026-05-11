import { Router } from 'express';
import { body } from 'express-validator';
import * as orderController from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Validation rules for public orders
const createPublicOrderValidation = [
  body('items')
    .isArray({ min: 1 }).withMessage('El pedido debe tener al menos un producto'),
  body('items.*.productId')
    .isMongoId().withMessage('ID de producto inválido'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
  body('customer.firstName')
    .trim()
    .notEmpty().withMessage('El nombre es requerido'),
  body('customer.lastName')
    .trim()
    .notEmpty().withMessage('El apellido es requerido'),
  body('customer.email')
    .trim()
    .isEmail().withMessage('Email inválido'),
  body('customer.phone')
    .trim()
    .notEmpty().withMessage('El teléfono es requerido'),
  body('shippingAddress.department')
    .trim()
    .notEmpty().withMessage('El departamento es requerido'),
  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('La ciudad es requerida'),
  body('shippingAddress.address')
    .trim()
    .notEmpty().withMessage('La dirección es requerida'),
  body('paymentMethod')
    .trim()
    .notEmpty().withMessage('El método de pago es requerido'),
];

const updateStatusValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Estado inválido'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Estado de pago inválido'),
];

// Public route - Create order without authentication
router.post('/public', validate(createPublicOrderValidation), orderController.createPublicOrder);

// User routes (authenticated)
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/:id', authenticate, orderController.getOrder);
router.post('/', authenticate, validate(createPublicOrderValidation), orderController.createOrder);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

// Admin routes
router.get('/', authenticate, authorize('admin'), orderController.getAllOrders);
router.put('/:id/status', authenticate, authorize('admin'), validate(updateStatusValidation), orderController.updateOrderStatus);

export default router;

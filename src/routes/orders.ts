import { Router } from 'express';
import { body } from 'express-validator';
import * as orderController from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Validation rules
const createOrderValidation = [
  body('items')
    .isArray({ min: 1 }).withMessage('El pedido debe tener al menos un producto'),
  body('items.*.productId')
    .isMongoId().withMessage('ID de producto inválido'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
  body('shippingAddress.street')
    .trim()
    .notEmpty().withMessage('La calle es requerida'),
  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('La ciudad es requerida'),
  body('shippingAddress.state')
    .trim()
    .notEmpty().withMessage('La provincia es requerida'),
  body('shippingAddress.postalCode')
    .trim()
    .notEmpty().withMessage('El código postal es requerido'),
  body('shippingAddress.country')
    .trim()
    .optional(),
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

// User routes
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/:id', authenticate, orderController.getOrder);
router.post('/', authenticate, validate(createOrderValidation), orderController.createOrder);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

// Admin routes
router.get('/', authenticate, authorize('admin'), orderController.getAllOrders);
router.put('/:id/status', authenticate, authorize('admin'), validate(updateStatusValidation), orderController.updateOrderStatus);

export default router;

import { Router } from 'express';
import { body } from 'express-validator';
import * as productController from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ max: 200 }).withMessage('El nombre no puede exceder 200 caracteres'),
  body('description')
    .trim()
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  body('price')
    .notEmpty().withMessage('El precio es requerido')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('compareAtPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio de comparación debe ser un número positivo'),
  body('images')
    .isArray({ min: 1 }).withMessage('Se requiere al menos una imagen'),
  body('category')
    .notEmpty().withMessage('La categoría es requerida')
    .isMongoId().withMessage('ID de categoría inválido'),
  body('stock')
    .notEmpty().withMessage('El stock es requerido')
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
];

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:slug', productController.getProduct);

// Admin routes
router.post('/', authenticate, authorize('admin'), validate(productValidation), productController.createProduct);
router.put('/:id', authenticate, authorize('admin'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

export default router;

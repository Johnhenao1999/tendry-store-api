import { Router } from 'express';
import { body } from 'express-validator';
import * as categoryController from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Validation rules
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('image')
    .optional()
    .isURL().withMessage('La imagen debe ser una URL válida'),
  body('parent')
    .optional()
    .isMongoId().withMessage('ID de categoría padre inválido'),
];

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategory);

// Admin routes
router.post('/', authenticate, authorize('admin'), validate(categoryValidation), categoryController.createCategory);
router.put('/:id', authenticate, authorize('admin'), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('admin'), categoryController.deleteCategory);

export default router;

import { Request, Response } from 'express';
import { Category } from '../models';
import { ApiResponse, AuthRequest } from '../types';

// Get all categories
export const getCategories = async (_req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort('name')
      .populate('parent', 'name slug');

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('GetCategories error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener categorías',
    });
  }
};

// Get single category
export const getCategory = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, isActive: true })
      .populate('parent', 'name slug');

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Categoría no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('GetCategory error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener categoría',
    });
  }
};

// Create category (Admin)
export const createCategory = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const categoryData = req.body;

    // Generate slug from name
    categoryData.slug = categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists
    const existingCategory = await Category.findOne({ slug: categoryData.slug });
    if (existingCategory) {
      res.status(400).json({
        success: false,
        error: 'Ya existe una categoría con ese nombre',
      });
      return;
    }

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: category,
    });
  } catch (error) {
    console.error('CreateCategory error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear categoría',
    });
  }
};

// Update category (Admin)
export const updateCategory = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If name changed, update slug
    if (updates.name) {
      updates.slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug exists (excluding current category)
      const existingCategory = await Category.findOne({ 
        slug: updates.slug, 
        _id: { $ne: id } 
      });
      if (existingCategory) {
        res.status(400).json({
          success: false,
          error: 'Ya existe una categoría con ese nombre',
        });
        return;
      }
    }

    const category = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Categoría no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Categoría actualizada',
      data: category,
    });
  } catch (error) {
    console.error('UpdateCategory error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar categoría',
    });
  }
};

// Delete category (Admin)
export const deleteCategory = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Categoría no encontrada',
      });
      return;
    }

    if (category.productCount > 0) {
      res.status(400).json({
        success: false,
        error: 'No se puede eliminar una categoría con productos',
      });
      return;
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Categoría eliminada',
    });
  } catch (error) {
    console.error('DeleteCategory error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar categoría',
    });
  }
};

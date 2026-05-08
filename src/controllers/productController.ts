import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, Category } from '../models';
import { ApiResponse, AuthRequest } from '../types';

// Get all products
export const getProducts = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      featured,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Build query
    const query: any = { isActive: true };

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category as string });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Execute query
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort as string)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('GetProducts error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos',
    });
  }
};

// Get single product
export const getProduct = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { slug } = req.params;
    const identifier = slug as string;

    // Check if it's a MongoDB ObjectId or a slug
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId 
      ? { _id: identifier, isActive: true } 
      : { slug: identifier, isActive: true };

    const product = await Product.findOne(query)
      .populate('category', 'name slug');

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('GetProduct error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener producto',
    });
  }
};

// Create product (Admin)
export const createProduct = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const productData = req.body;

    // Generate slug from name
    productData.slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      productData.slug = `${productData.slug}-${Date.now()}`;
    }

    const product = await Product.create(productData);

    // Update category product count
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: 1 } });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: populatedProduct,
    });
  } catch (error) {
    console.error('CreateProduct error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear producto',
    });
  }
};

// Update product (Admin)
export const updateProduct = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      });
      return;
    }

    // If category changed, update product counts
    if (updates.category && updates.category !== product.category.toString()) {
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
      await Category.findByIdAndUpdate(updates.category, { $inc: { productCount: 1 } });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Producto actualizado',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('UpdateProduct error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar producto',
    });
  }
};

// Delete product (Admin)
export const deleteProduct = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      });
      return;
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    // Update category count
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

    res.json({
      success: true,
      message: 'Producto eliminado',
    });
  } catch (error) {
    console.error('DeleteProduct error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar producto',
    });
  }
};

// Get featured products
export const getFeaturedProducts = async (_req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .limit(8)
      .sort('-createdAt');

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('GetFeaturedProducts error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos destacados',
    });
  }
};

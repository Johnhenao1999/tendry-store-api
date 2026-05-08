import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../types';

const specificationSchema = new Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [2000, 'La descripción no puede exceder 2000 caracteres'],
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo'],
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'El precio de comparación no puede ser negativo'],
  },
  images: [{
    type: String,
    required: true,
  }],
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La categoría es requerida'],
  },
  stock: {
    type: Number,
    required: [true, 'El stock es requerido'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0,
  },
  sku: {
    type: String,
    trim: true,
    uppercase: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  specifications: [specificationSchema],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Generate slug from name before saving
productSchema.pre('save', function() {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Include virtuals in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;

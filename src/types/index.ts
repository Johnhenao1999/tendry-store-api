import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User types
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'customer';
  avatar?: string;
  phone?: string;
  addresses: IAddress[];
  wishlist: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

// Product types
export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: Types.ObjectId;
  stock: number;
  sku?: string;
  tags: string[];
  specifications: ISpecification[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpecification {
  name: string;
  value: string;
}

// Category types
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Types.ObjectId;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  user?: Types.ObjectId;
  customer: ICustomerInfo;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  shippingAddress: IShippingAddress;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface IShippingAddress {
  department: string;
  city: string;
  address: string;
  postalCode?: string;
  country: string;
}

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// Review types
export interface IReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

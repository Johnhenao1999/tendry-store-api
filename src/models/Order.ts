import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../types';

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
}, { _id: false });

const addressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'España' },
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: [(val: any[]) => val.length > 0, 'El pedido debe tener al menos un producto'],
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  shipping: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  shippingAddress: {
    type: addressSchema,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', async function() {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.orderNumber = `TDX-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
  }
});

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;

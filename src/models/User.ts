import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const addressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'España' },
  isDefault: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer',
  },
  avatar: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
  },
  addresses: [addressSchema],
  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;

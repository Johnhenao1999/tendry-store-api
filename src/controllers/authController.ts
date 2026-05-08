import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest, ApiResponse, JWTPayload } from '../types';
import config from '../config';

const generateToken = (userId: string, email: string, role: 'admin' | 'customer'): string => {
  const payload: JWTPayload = { userId, email, role };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
};

// Register new user
export const register = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'El email ya está registrado',
      });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar usuario',
    });
  }
};

// Login user
export const login = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión',
    });
  }
};

// Get current user
export const getMe = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).populate('wishlist');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener perfil',
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { name, phone, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Perfil actualizado',
      data: user,
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar perfil',
    });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: 'Contraseña actual incorrecta',
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    console.error('ChangePassword error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar contraseña',
    });
  }
};

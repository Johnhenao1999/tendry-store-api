import { Request, Response } from 'express';
import { Order, Product } from '../models';
import { ApiResponse, AuthRequest } from '../types';

// Get user orders
export const getMyOrders = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const total = await Order.countDocuments({ user: req.user?._id });
    const orders = await Order.find({ user: req.user?._id })
      .sort('-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('GetMyOrders error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pedidos',
    });
  }
};

// Get single order
export const getOrder = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ 
      _id: id,
      ...(req.user?.role !== 'admin' && { user: req.user?._id }),
    }).populate('items.product', 'name slug images');

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Pedido no encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('GetOrder error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pedido',
    });
  }
};

// Create order
export const createOrder = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    // Validate stock and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        res.status(400).json({
          success: false,
          error: `Producto no encontrado: ${item.productId}`,
        });
        return;
      }

      if (product.stock < item.quantity) {
        res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${product.name}`,
        });
        return;
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '',
      });

      subtotal += product.price * item.quantity;

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate totals (21% IVA in Spain)
    const tax = subtotal * 0.21;
    const shipping = subtotal >= 50 ? 0 : 4.99; // Free shipping over 50€
    const total = subtotal + tax + shipping;

    const order = await Order.create({
      user: req.user?._id,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      paymentMethod,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: order,
    });
  } catch (error) {
    console.error('CreateOrder error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear pedido',
    });
  }
};

// Update order status (Admin)
export const updateOrderStatus = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Pedido no encontrado',
      });
      return;
    }

    // If cancelling, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.json({
      success: true,
      message: 'Estado del pedido actualizado',
      data: order,
    });
  } catch (error) {
    console.error('UpdateOrderStatus error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar pedido',
    });
  }
};

// Get all orders (Admin)
export const getAllOrders = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const query: any = {};
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('GetAllOrders error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pedidos',
    });
  }
};

// Cancel order
export const cancelOrder = async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user?._id,
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Pedido no encontrado',
      });
      return;
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      res.status(400).json({
        success: false,
        error: 'No se puede cancelar este pedido',
      });
      return;
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Pedido cancelado',
      data: order,
    });
  } catch (error) {
    console.error('CancelOrder error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cancelar pedido',
    });
  }
};

import crypto from 'crypto';

// Polyfill for crypto (needed for MongoDB with Node < 20)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category, Product, User } from '../models';

dotenv.config();

const categories = [
  {
    name: 'Esencias Clásico',
    slug: 'esencias-clasico',
    description: 'Fragancias atemporales que nunca pasan de moda. Elegancia y sofisticación en cada gota.',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
    productCount: 0,
  },
  {
    name: 'Frascos 30ml',
    slug: 'frascos-30ml',
    description: 'Perfecto para llevar contigo. Tamaño ideal para el día a día.',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500',
    productCount: 0,
  },
  {
    name: 'Presentación Lujo',
    slug: 'presentacion-lujo',
    description: 'Ediciones especiales con packaging premium. Ideal para regalo.',
    image: 'https://images.unsplash.com/photo-1588514727390-91fd5ebaef81?w=500',
    productCount: 0,
  },
  {
    name: 'Calidad 1:1',
    slug: 'calidad-1-1',
    description: 'Réplicas de alta fidelidad de las marcas más exclusivas.',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500',
    productCount: 0,
  },
  {
    name: '100% Originales',
    slug: '100-originales',
    description: 'Perfumes originales de las mejores casas de perfumería.',
    image: 'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=500',
    productCount: 0,
  },
];

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tendry-store';
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️ Datos anteriores eliminados');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ ${createdCategories.length} categorías creadas`);

    // Create sample products for each category
    const products = [];
    const fragranceNames = [
      'Midnight Rose', 'Ocean Breeze', 'Golden Amber', 'Velvet Noir',
      'Crystal White', 'Royal Oud', 'Fresh Citrus', 'Wild Jasmine',
      'Dark Spice', 'Sweet Vanilla', 'Mystic Wood', 'Pure Musk',
    ];

    for (const category of createdCategories) {
      for (let i = 0; i < 4; i++) {
        const name = `${fragranceNames[Math.floor(Math.random() * fragranceNames.length)]} ${category.name.split(' ')[0]}`;
        const price = Math.floor(Math.random() * 50) + 20;
        
        products.push({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() + i,
          description: `Fragancia exclusiva de nuestra colección ${category.name}. Una experiencia olfativa única que combina notas de salida frescas con un fondo cálido y envolvente.`,
          price,
          compareAtPrice: price + Math.floor(Math.random() * 20) + 10,
          images: [
            'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500',
          ],
          category: category._id,
          stock: Math.floor(Math.random() * 50) + 10,
          sku: `TDX-${category.slug.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          tags: ['perfume', 'fragancia', category.slug],
          specifications: [
            { name: 'Volumen', value: '100ml' },
            { name: 'Tipo', value: 'Eau de Parfum' },
            { name: 'Familia olfativa', value: 'Oriental' },
          ],
          rating: Math.floor(Math.random() * 2) + 3 + Math.random(),
          reviewCount: Math.floor(Math.random() * 50),
          isFeatured: Math.random() > 0.7,
        });
      }
    }

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ ${createdProducts.length} productos creados`);

    // Update category product counts
    for (const category of createdCategories) {
      const count = await Product.countDocuments({ category: category._id });
      await Category.findByIdAndUpdate(category._id, { productCount: count });
    }
    console.log('✅ Conteo de productos actualizado');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@tendryx.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin TENDRYX',
        email: 'admin@tendryx.com',
        password: 'admin123456',
        role: 'admin',
      });
      console.log('✅ Usuario admin creado (admin@tendryx.com / admin123456)');
    }

    console.log('\n🎉 Base de datos poblada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    process.exit(1);
  }
};

seedDatabase();

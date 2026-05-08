import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tendry-store';
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB conectado exitosamente');
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
    });

  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;

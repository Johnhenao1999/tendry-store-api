# TENDRYX Store API

API REST para la tienda de perfumes TENDRYX.

## Tecnologías

- **Node.js** + **Express** - Framework web
- **TypeScript** - Tipado estático
- **MongoDB** + **Mongoose** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas

## Requisitos

- Node.js 22.x
- MongoDB (local o Atlas)

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Poblar base de datos con datos de ejemplo
npm run seed

# Iniciar en modo desarrollo
npm run dev
```

## Variables de Entorno

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/tendry-store
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## Endpoints API

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `GET /api/v1/auth/me` - Perfil del usuario actual
- `PUT /api/v1/auth/profile` - Actualizar perfil
- `PUT /api/v1/auth/password` - Cambiar contraseña

### Productos
- `GET /api/v1/products` - Listar productos
- `GET /api/v1/products/featured` - Productos destacados
- `GET /api/v1/products/:slug` - Detalle de producto
- `POST /api/v1/products` - Crear producto (admin)
- `PUT /api/v1/products/:id` - Actualizar producto (admin)
- `DELETE /api/v1/products/:id` - Eliminar producto (admin)

### Categorías
- `GET /api/v1/categories` - Listar categorías
- `GET /api/v1/categories/:slug` - Detalle de categoría
- `POST /api/v1/categories` - Crear categoría (admin)
- `PUT /api/v1/categories/:id` - Actualizar categoría (admin)
- `DELETE /api/v1/categories/:id` - Eliminar categoría (admin)

### Pedidos
- `GET /api/v1/orders/my-orders` - Mis pedidos
- `GET /api/v1/orders/:id` - Detalle de pedido
- `POST /api/v1/orders` - Crear pedido
- `POST /api/v1/orders/:id/cancel` - Cancelar pedido
- `GET /api/v1/orders` - Todos los pedidos (admin)
- `PUT /api/v1/orders/:id/status` - Actualizar estado (admin)

## Usuario Admin por defecto

Después de ejecutar `npm run seed`:

- **Email:** admin@tendryx.com
- **Password:** admin123456

## Scripts

```bash
npm run dev      # Desarrollo con hot reload
npm run build    # Compilar TypeScript
npm run start    # Producción
npm run seed     # Poblar base de datos
```

## Contacto

- WhatsApp: +34 611242280
- Instagram: @tendryxstore_11
- Facebook: Juan Diego Velez

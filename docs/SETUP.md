# Setup Guide - Digital Store

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Git

## Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` dengan konfigurasi Anda:**
   - Database credentials
   - Midtrans API keys
   - MinIO credentials
   - JWT secret

## Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MinIO Console**: http://localhost:9001
- **PostgreSQL**: localhost:5432

## Database Setup

```bash
# Connect to database
docker exec -it digital-store-db psql -U postgres -d digital_store

# Run migrations
docker exec digital-store-backend node src/database/migrate.js
```

## Default Admin Account

- Email: `admin@example.com`
- Password: `secure_password` (ubah di `.env`)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product detail
- `POST /api/products` - Create product (authenticated)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `POST /api/orders/callback` - Payment callback

### Downloads
- `GET /api/downloads/link/:order_id` - Get download link
- `GET /api/downloads/history` - Download history

## Payment Integration (Midtrans)

1. Register at https://midtrans.com
2. Get Server Key & Client Key
3. Update `.env` with your keys
4. Use sandbox environment for testing

## File Storage (MinIO)

Files are stored in MinIO bucket. Access MinIO console at:
- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

## Troubleshooting

### Database connection error
```bash
docker-compose restart postgres
```

### Port already in use
Change port in `docker-compose.yml` or `.env`

### MinIO not initializing
```bash
docker-compose exec minio /bin/sh
mc alias set myminio http://localhost:9000 minioadmin minioadmin
mc mb myminio/digital-products
```

## Production Deployment

1. Use environment variables from CI/CD platform
2. Set `NODE_ENV=production`
3. Use persistent volumes for database & MinIO
4. Configure backup strategy
5. Set up monitoring & logging
6. Use reverse proxy (nginx)

## Documentation

- [Backend API Docs](./API.md)
- [Frontend Setup](./FRONTEND.md)
- [Database Schema](./DATABASE.md)

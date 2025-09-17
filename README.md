# Microservices Learning Application

This project demonstrates a microservices architecture with Node.js, Docker, and database integration. It consists of four services:

1. **API Gateway** - Routes requests to appropriate microservices
2. **Users Service** - Manages user data with MongoDB
3. **Products Service** - Manages product inventory with MongoDB
4. **Orders Service** - Handles order processing with PostgreSQL (via Supabase and Prisma)

## Architecture Overview

![Microservices Architecture](https://i.imgur.com/8JZBnGm.png)

- **API Gateway** (Port 3000): Entry point for all client requests
- **Users Service** (Port 3001): Manages user data with MongoDB
- **Products Service** (Port 3002): Handles product inventory with MongoDB
- **Orders Service** (Port 3003): Processes orders with PostgreSQL via Supabase and Prisma
- **RabbitMQ**: Message broker for asynchronous communication between services
- **MongoDB**: NoSQL database for Users and Products services
- **PostgreSQL**: Relational database for Orders service

## Key Microservices Concepts Demonstrated

- Service Discovery (via Docker Compose networking)
- API Gateway Pattern
- Inter-service Communication
- Containerization with Docker
- Independent Deployment
- Domain-Driven Design (each service handles its own domain)
- Polyglot Persistence (different database types for different services)
- Event-Driven Architecture with RabbitMQ
- Database Integration with ORMs (Mongoose, Prisma)
- Data Seeding and Migration

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine
- Node.js (for local development)
- MongoDB (automatically set up via Docker)
- PostgreSQL (via Supabase, automatically set up via Docker)

### Environment Variables

Create a `.env` file in each service directory with the following variables:

**Users Service & Products Service**
```
MONGODB_URI=mongodb://mongodb:27017/serviceName
```

**Orders Service**
```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/orders
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### Running the Application

1. Clone this repository
2. From the project root directory, run:

```bash
docker-compose up
```

This will build and start all services including databases. The API will be available at http://localhost:3000.

### Testing Database Integration

To test the database integration across all services:

```bash
npm install
npm run test:db
```

This will run a test script that verifies all CRUD operations against each database.

### Local Development

To run any service locally for development:

1. Navigate to the service directory
2. Install dependencies:
```bash
npm install
```
3. Start the service in development mode:
```bash
npm run dev
```

## API Endpoints

### API Gateway (http://localhost:3000)

- All requests are proxied to the appropriate service based on the URL path:
  - `/users/*` → Users Service
  - `/products/*` → Products Service
  - `/orders/*` → Orders Service

### Users Service

- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create a new user
- `PUT /users/:id` - Update a user
- `DELETE /users/:id` - Delete a user

### Products Service

- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create a new product
- `PUT /products/:id` - Update a product
- `DELETE /products/:id` - Delete a product

### Orders Service

- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order by ID
- `GET /orders/user/:userId` - Get orders by user ID
- `POST /orders` - Create a new order
- `PATCH /orders/:id/status` - Update order status
- `DELETE /orders/:id` - Delete an order

## Kubernetes Deployment

This project includes Kubernetes manifests for deploying the entire microservices architecture to a Kubernetes cluster.

### Prerequisites

- Kubernetes cluster (Minikube, Docker Desktop Kubernetes, or a cloud provider)
- kubectl CLI tool installed
- PowerShell (for Windows) or Bash (for Linux/Mac)

### Kubernetes Components

- **StatefulSets**: For databases (MongoDB, PostgreSQL) and RabbitMQ
- **Deployments**: For all microservices
- **Services**: For internal communication
- **ConfigMaps & Secrets**: For configuration and sensitive data
- **Ingress**: For external access to the services

### Deployment Steps

1. **Update Secrets**: Edit `kubernetes/config/secrets.yaml` with your actual Supabase credentials

2. **Set Docker Registry**: Update the `DOCKER_REGISTRY` variable in `kubernetes/deploy.ps1` with your Docker registry

3. **Build and Push Docker Images**:
   ```bash
   docker-compose build
   docker-compose push
   ```

4. **Deploy to Kubernetes**:
   ```powershell
   cd kubernetes
   ./deploy.ps1
   ```

5. **Access the Application**:
   - Add `microservices.local` to your hosts file pointing to your cluster IP
   - Access the application at http://microservices.local

### Kubernetes Folder Structure

```
kubernetes/
├── config/
│   ├── configmaps.yaml
│   └── secrets.yaml
├── databases/
│   ├── mongodb.yaml
│   └── postgres.yaml
├── messaging/
│   └── rabbitmq.yaml
├── services/
│   ├── api-gateway.yaml
│   ├── ingress.yaml
│   ├── orders-service.yaml
│   ├── products-service.yaml
│   └── users-service.yaml
└── deploy.ps1
```

## Next Steps for Learning

1. ✅ Add persistent databases to each service
2. ✅ Implement Kubernetes deployment
3. Implement authentication and authorization
4. Add service discovery with tools like Consul or Eureka
5. Implement circuit breakers with Hystrix or similar tools
6. Add monitoring and logging with ELK stack or Prometheus/Grafana
7. ✅ Implement message queues for asynchronous communication
8. Create CI/CD pipelines for each service
9. Add comprehensive error handling and retry mechanisms
10. Implement API versioning
11. Add caching layer for improved performance

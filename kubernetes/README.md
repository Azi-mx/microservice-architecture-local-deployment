# Microservices Kubernetes Deployment

This directory contains Kubernetes manifests and scripts for deploying the microservices architecture to a Kubernetes cluster.

## Architecture Overview

The microservices architecture consists of:

- **API Gateway**: Entry point for all client requests
- **Users Service**: Manages user data with MongoDB
- **Products Service**: Manages product data with MongoDB
- **Orders Service**: Manages order data with PostgreSQL and Supabase
- **RabbitMQ**: Message broker for inter-service communication
- **MongoDB**: NoSQL database for users and products (separate instances)
- **PostgreSQL**: SQL database for orders

## Directory Structure

```
kubernetes/
├── config/
│   ├── configmaps.yaml    # Environment variables for services
│   └── secrets.yaml       # Sensitive data (credentials)
├── databases/
│   ├── mongodb.yaml       # MongoDB StatefulSets for users and products
│   └── postgres.yaml      # PostgreSQL StatefulSet for orders
├── messaging/
│   └── rabbitmq.yaml      # RabbitMQ StatefulSet
├── services/
│   ├── api-gateway.yaml   # API Gateway Deployment and Service
│   ├── ingress.yaml       # Ingress for external access
│   ├── orders-service.yaml # Orders Service Deployment and Service
│   ├── products-service.yaml # Products Service Deployment and Service
│   └── users-service.yaml # Users Service Deployment and Service
├── build-images.ps1       # Script to build Docker images
└── deploy.ps1             # Script to deploy to Kubernetes
```

## Prerequisites

- Kubernetes cluster (Minikube, Docker Desktop, or a cloud provider)
- kubectl configured to access your cluster
- Docker installed for building images
- PowerShell for running the deployment scripts

## Deployment Steps

### 1. Build Docker Images

Run the build script to create Docker images for all services:

```powershell
cd kubernetes
./build-images.ps1
```

This will build and tag the following images:
- localhost/api-gateway:latest
- localhost/users-service:latest
- localhost/products-service:latest
- localhost/orders-service:latest

### 2. Deploy to Kubernetes

Run the deployment script to deploy all components to Kubernetes:

```powershell
cd kubernetes
./deploy.ps1
```

The script will:
1. Create a `microservices` namespace
2. Apply ConfigMaps and Secrets
3. Deploy database StatefulSets (MongoDB and PostgreSQL)
4. Deploy RabbitMQ
5. Deploy all microservices
6. Configure the API Gateway and Ingress

### 3. Access the Application

The application will be available at `http://microservices.local` if you've configured your hosts file.

Add this entry to your hosts file:
```
127.0.0.1 microservices.local
```

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Linux/Mac: `/etc/hosts`

## Service Endpoints

- API Gateway: `http://microservices.local/`
- Users Service: `http://microservices.local/users`
- Products Service: `http://microservices.local/products`
- Orders Service: `http://microservices.local/orders`
- RabbitMQ Management: `http://microservices.local/rabbitmq`

## Sample Data

The deployment includes automatic seeding of sample data:

- Users Service: 5 sample users (including admin and regular users)
- Products Service: 7 sample products across different categories
- Orders Service: 3 sample orders with various items and statuses

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n microservices
```

### View Pod Logs

```bash
kubectl logs -n microservices <pod-name>
```

### Restart a Deployment

```bash
kubectl rollout restart deployment <deployment-name> -n microservices
```

### Access Database Directly

```bash
# MongoDB for Users
kubectl exec -it -n microservices mongodb-users-0 -- mongo

# MongoDB for Products
kubectl exec -it -n microservices mongodb-products-0 -- mongo

# PostgreSQL for Orders
kubectl exec -it -n microservices postgres-orders-0 -- psql -U postgres -d orders_db
```

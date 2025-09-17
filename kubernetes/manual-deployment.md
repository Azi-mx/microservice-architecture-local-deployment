# Manual Kubernetes Deployment Instructions

This guide provides step-by-step instructions for manually deploying the microservices architecture to Kubernetes without relying on PowerShell scripts.

## Prerequisites

- Kubernetes cluster running (Docker Desktop, Minikube, or cloud provider)
- kubectl configured to access your cluster
- Docker installed and running

## Step 1: Build and Tag Docker Images

Run the following commands to build and tag all service images:

```bash
# Users Service
docker build -t localhost/users-service:latest ../users-service

# Products Service
docker build -t localhost/products-service:latest ../products-service

# Orders Service
docker build -t localhost/orders-service:latest ../orders-service

# API Gateway
docker build -t localhost/api-gateway:latest ../api-gateway
```

## Step 2: Create Kubernetes Namespace

```bash
kubectl create namespace microservices
```

## Step 3: Apply ConfigMaps and Secrets

```bash
kubectl apply -f ./config/configmaps.yaml -n microservices
kubectl apply -f ./config/secrets.yaml -n microservices
```

## Step 4: Deploy Database StatefulSets

```bash
# Deploy MongoDB for Users and Products
kubectl apply -f ./databases/mongodb.yaml -n microservices

# Deploy PostgreSQL for Orders
kubectl apply -f ./databases/postgres.yaml -n microservices
```

## Step 5: Deploy RabbitMQ

```bash
kubectl apply -f ./messaging/rabbitmq.yaml -n microservices
```

## Step 6: Wait for Databases and RabbitMQ to be Ready

Check the status of the database pods:

```bash
kubectl get pods -n microservices
```

Wait until all database and RabbitMQ pods show `Running` status.

## Step 7: Deploy Microservices

Before applying the YAML files, you need to replace the `${DOCKER_REGISTRY}` placeholder with `localhost`:

### Users Service

```bash
# Replace ${DOCKER_REGISTRY} with localhost
sed 's/${DOCKER_REGISTRY}/localhost/g' ./services/users-service.yaml | kubectl apply -f - -n microservices
```

### Products Service

```bash
# Replace ${DOCKER_REGISTRY} with localhost
sed 's/${DOCKER_REGISTRY}/localhost/g' ./services/products-service.yaml | kubectl apply -f - -n microservices
```

### Orders Service

```bash
# Replace ${DOCKER_REGISTRY} with localhost
sed 's/${DOCKER_REGISTRY}/localhost/g' ./services/orders-service.yaml | kubectl apply -f - -n microservices
```

### API Gateway

```bash
# Replace ${DOCKER_REGISTRY} with localhost
sed 's/${DOCKER_REGISTRY}/localhost/g' ./services/api-gateway.yaml | kubectl apply -f - -n microservices
```

## Step 8: Deploy Ingress

```bash
kubectl apply -f ./services/ingress.yaml -n microservices
```

## Step 9: Verify Deployment

Check that all pods are running:

```bash
kubectl get pods -n microservices
```

Check the services:

```bash
kubectl get services -n microservices
```

Check the ingress:

```bash
kubectl get ingress -n microservices
```

## Step 10: Configure Local Host File

Add the following entry to your hosts file:

```
127.0.0.1 microservices.local
```

- Windows: Edit `C:\Windows\System32\drivers\etc\hosts`
- Linux/Mac: Edit `/etc/hosts`

## Step 11: Access the Application

Open your browser and navigate to:

```
http://microservices.local
```

## Troubleshooting

### View Pod Logs

```bash
kubectl logs -n microservices <pod-name>
```

### Describe Pod for Details

```bash
kubectl describe pod -n microservices <pod-name>
```

### Restart a Deployment

```bash
kubectl rollout restart deployment <deployment-name> -n microservices
```

### Delete and Redeploy

If you need to start over:

```bash
kubectl delete namespace microservices
kubectl create namespace microservices
# Then repeat steps 3-8
```

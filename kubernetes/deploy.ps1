#!/usr/bin/env pwsh
# Kubernetes Deployment Script for Microservices Project

# Set Docker Registry to use local images
$env:DOCKER_REGISTRY = "localhost"

# Create namespace if it doesn't exist
Write-Host "Creating microservices namespace..." -ForegroundColor Green
kubectl create namespace microservices --dry-run=client -o yaml | kubectl apply -f -

# Apply ConfigMaps and Secrets first
Write-Host "Applying ConfigMaps and Secrets..." -ForegroundColor Green
kubectl apply -f ./config/configmaps.yaml -n microservices
kubectl apply -f ./config/secrets.yaml -n microservices

# Apply Database StatefulSets
Write-Host "Deploying MongoDB for Users and Products..." -ForegroundColor Green
kubectl apply -f ./databases/mongodb.yaml -n microservices

Write-Host "Deploying PostgreSQL for Orders..." -ForegroundColor Green
kubectl apply -f ./databases/postgres.yaml -n microservices

# Apply RabbitMQ StatefulSet
Write-Host "Deploying RabbitMQ..." -ForegroundColor Green
kubectl apply -f ./messaging/rabbitmq.yaml -n microservices

# Wait for databases and messaging to be ready
Write-Host "Waiting for databases and messaging to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Apply Microservices
Write-Host "Deploying Users Service..." -ForegroundColor Green
$usersYaml = Get-Content -Path ./services/users-service.yaml -Raw
$usersYaml = $usersYaml.Replace('${DOCKER_REGISTRY}', $env:DOCKER_REGISTRY)
$usersYaml | kubectl apply -f - -n microservices

Write-Host "Deploying Products Service..." -ForegroundColor Green
$productsYaml = Get-Content -Path ./services/products-service.yaml -Raw
$productsYaml = $productsYaml.Replace('${DOCKER_REGISTRY}', $env:DOCKER_REGISTRY)
$productsYaml | kubectl apply -f - -n microservices

Write-Host "Deploying Orders Service..." -ForegroundColor Green
$ordersYaml = Get-Content -Path ./services/orders-service.yaml -Raw
$ordersYaml = $ordersYaml.Replace('${DOCKER_REGISTRY}', $env:DOCKER_REGISTRY)
$ordersYaml | kubectl apply -f - -n microservices

# Wait for services to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Apply API Gateway
Write-Host "Deploying API Gateway..." -ForegroundColor Green
$gatewayYaml = Get-Content -Path ./services/api-gateway.yaml -Raw
$gatewayYaml = $gatewayYaml.Replace('${DOCKER_REGISTRY}', $env:DOCKER_REGISTRY)
$gatewayYaml | kubectl apply -f - -n microservices

# Apply Ingress last
Write-Host "Deploying Ingress..." -ForegroundColor Green
kubectl apply -f ./services/ingress.yaml -n microservices

# Display resources
Write-Host "Deployment complete! Here are your resources:" -ForegroundColor Green
kubectl get all -n microservices

# Add microservices.local to hosts file if needed
Write-Host "Don't forget to add 'microservices.local' to your hosts file pointing to your cluster IP" -ForegroundColor Yellow

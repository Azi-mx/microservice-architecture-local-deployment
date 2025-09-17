#!/usr/bin/env pwsh
# Script to build and tag Docker images for Kubernetes deployment

# Set Docker Registry
$registry = "localhost"

# Build and tag images
Write-Host "Building and tagging Docker images for Kubernetes deployment..." -ForegroundColor Green

# Users Service
Write-Host "Building users-service..." -ForegroundColor Cyan
docker build -t $registry/users-service:latest ../users-service
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build users-service" -ForegroundColor Red
    exit 1
}

# Products Service
Write-Host "Building products-service..." -ForegroundColor Cyan
docker build -t $registry/products-service:latest ../products-service
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build products-service" -ForegroundColor Red
    exit 1
}

# Orders Service
Write-Host "Building orders-service..." -ForegroundColor Cyan
docker build -t $registry/orders-service:latest ../orders-service
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build orders-service" -ForegroundColor Red
    exit 1
}

# API Gateway
Write-Host "Building api-gateway..." -ForegroundColor Cyan
docker build -t $registry/api-gateway:latest ../api-gateway
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build api-gateway" -ForegroundColor Red
    exit 1
}

Write-Host "All images built successfully!" -ForegroundColor Green
Write-Host "Images are tagged with $registry and ready for Kubernetes deployment" -ForegroundColor Green

# List the built images
docker images | Select-String "$registry"

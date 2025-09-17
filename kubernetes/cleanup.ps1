#!/usr/bin/env pwsh
# Kubernetes Cleanup Script for Microservices Project

# Display header
Write-Host "====================================================" -ForegroundColor Yellow
Write-Host "  Kubernetes Microservices Cleanup Script" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Yellow

# Ask for confirmation
$confirmation = Read-Host "This will delete all resources in the 'microservices' namespace. Continue? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Cleanup cancelled." -ForegroundColor Red
    exit
}

# Delete Ingress
Write-Host "Deleting Ingress..." -ForegroundColor Cyan
kubectl delete ingress microservices-ingress -n microservices

# Delete Services
Write-Host "Deleting Services..." -ForegroundColor Cyan
kubectl delete service api-gateway users-service products-service orders-service -n microservices

# Delete Deployments
Write-Host "Deleting Deployments..." -ForegroundColor Cyan
kubectl delete deployment api-gateway users-service products-service orders-service -n microservices

# Delete StatefulSets and their Services
Write-Host "Deleting StatefulSets..." -ForegroundColor Cyan
kubectl delete statefulset mongodb-users mongodb-products postgres-orders rabbitmq -n microservices
kubectl delete service mongodb-users mongodb-products postgres-orders rabbitmq-service -n microservices

# Delete ConfigMaps and Secrets
Write-Host "Deleting ConfigMaps and Secrets..." -ForegroundColor Cyan
kubectl delete configmap users-config products-config orders-config api-gateway-config -n microservices
kubectl delete secret supabase-secrets postgres-secrets mongodb-secrets -n microservices

# Delete PersistentVolumeClaims
Write-Host "Deleting PersistentVolumeClaims..." -ForegroundColor Cyan
kubectl delete pvc mongodb-users-data-claim mongodb-products-data-claim postgres-orders-data-claim rabbitmq-data-claim -n microservices

# Delete Namespace
Write-Host "Deleting Namespace..." -ForegroundColor Cyan
kubectl delete namespace microservices

# Final message
Write-Host "====================================================" -ForegroundColor Green
Write-Host "  Cleanup Complete!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

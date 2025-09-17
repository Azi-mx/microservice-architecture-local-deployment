# Amazon EKS Deployment Guide

This guide walks through deploying the microservices application to Amazon EKS.

## Prerequisites

- AWS CLI installed and configured
- kubectl installed
- eksctl installed
- Docker installed
- AWS account with appropriate permissions

## Step 1: Set up AWS CLI and Configure Credentials

```bash
# Install AWS CLI (if not already installed)
# For Windows:
# Download from: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, region (e.g., us-east-1), output format (json)
```

## Step 2: Create EKS Cluster

```bash
# Create EKS cluster using eksctl
eksctl create cluster \
  --name windsurf-cluster \
  --version 1.27 \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 5 \
  --with-oidc \
  --managed
```

This process takes approximately 15-20 minutes to complete.

## Step 3: Configure kubectl for EKS

```bash
# Update kubeconfig to connect to your EKS cluster
aws eks update-kubeconfig --name windsurf-cluster --region us-east-1

# Verify connection
kubectl get nodes
```

## Step 4: Set up EBS CSI Driver for Persistent Storage

```bash
# Create IAM policy and service account for EBS CSI Driver
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster windsurf-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --role-only \
  --role-name AmazonEKS_EBS_CSI_DriverRole

# Install EBS CSI Driver
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/?ref=master"
```

## Step 5: Create ECR Repositories and Push Images

```bash
# Create ECR repositories for each service
for service in api-gateway users-service products-service orders-service; do
  aws ecr create-repository --repository-name $service
done

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker-compose build

# Tag and push images
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1

for service in api-gateway users-service products-service orders-service; do
  docker tag windsurf-project_$service:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$service:latest
  docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/$service:latest
done
```

## Step 6: Update Secrets for Supabase

Edit the `kubernetes/config/secrets.yaml` file with your actual Supabase credentials:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: supabase-secrets
type: Opaque
stringData:
  SUPABASE_URL: "your_actual_supabase_url"
  SUPABASE_KEY: "your_actual_supabase_key"
```

## Step 7: Install AWS Load Balancer Controller

```bash
# Add Helm repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install AWS Load Balancer Controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=windsurf-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

## Step 8: Deploy the Application

Run the EKS deployment script:

```bash
cd kubernetes
./deploy-eks.ps1
```

## Step 9: Access Your Application

After deployment completes, get the ALB URL:

```bash
kubectl get ingress microservices-ingress -n microservices
```

The application will be available at the ADDRESS shown in the output.

## Step 10: Set up DNS with Route 53 (Optional)

If you have a domain name, you can create a CNAME record pointing to the ALB URL:

1. Go to Route 53 in AWS Console
2. Select your hosted zone
3. Create a record with:
   - Record name: microservices
   - Record type: CNAME
   - Value: [ALB URL from previous step]
   - TTL: 300

## Step 11: Set up Monitoring with CloudWatch (Optional)

```bash
# Install CloudWatch agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
```

## Cleanup

When you're done with the cluster:

```bash
eksctl delete cluster --name windsurf-cluster --region us-east-1
```

## Troubleshooting

1. **Pod stuck in Pending state**: Check if EBS volumes are being created correctly
2. **Service not accessible**: Verify ALB Ingress Controller is running
3. **Database connection issues**: Check ConfigMaps and Secrets are correctly applied

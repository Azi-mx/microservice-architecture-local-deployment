# Setting Up Kubernetes Dashboard

This guide provides instructions for setting up the Kubernetes Dashboard, a web-based UI for managing your Kubernetes cluster.

## Step 1: Deploy the Dashboard

```bash
# Apply the dashboard manifest
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```

## Step 2: Create an Admin User

Create a file named `dashboard-adminuser.yaml` with the following content:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
```

Apply the configuration:

```bash
kubectl apply -f dashboard-adminuser.yaml
```

## Step 3: Get the Bearer Token

For Kubernetes v1.24 and later:

```bash
kubectl create token admin-user -n kubernetes-dashboard
```

For older Kubernetes versions:

```bash
kubectl -n kubernetes-dashboard get secret $(kubectl -n kubernetes-dashboard get sa/admin-user -o jsonpath="{.secrets[0].name}") -o go-template="{{.data.token | base64decode}}"
```

Copy the token that is output.

## Step 4: Start the Kubernetes Proxy

```bash
kubectl proxy
```

## Step 5: Access the Dashboard

Open your browser and navigate to:

```
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

Select "Token" and paste the token you copied in Step 3.

## Step 6: View Your Microservices

Once logged in:

1. Select "Namespace" dropdown and choose "microservices"
2. Navigate through the dashboard to view:
   - Deployments
   - StatefulSets
   - Pods
   - Services
   - ConfigMaps
   - Secrets

## Using the Dashboard

### Viewing Resources

- **Overview**: See the health of your cluster at a glance
- **Workloads**: View deployments, pods, replica sets, etc.
- **Services**: View services, ingresses, etc.
- **Config**: View ConfigMaps and Secrets

### Monitoring

- View CPU and memory usage for pods
- View logs for pods
- View events for troubleshooting

### Management

- Scale deployments up or down
- Edit resources directly
- Delete resources when needed

## Troubleshooting

### Dashboard Not Loading

Check if the dashboard pods are running:

```bash
kubectl get pods -n kubernetes-dashboard
```

### Authentication Issues

If you encounter token errors, recreate the token:

```bash
kubectl delete -f dashboard-adminuser.yaml
kubectl apply -f dashboard-adminuser.yaml
# Then get a new token using the commands in Step 3
```

### Proxy Connection Issues

If you can't connect to the proxy, ensure it's running and try a different port:

```bash
kubectl proxy --port=8002
```

Then access the dashboard at:
```
http://localhost:8002/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

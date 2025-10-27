# BPMN DESIGNER V1.0

## Build the Container

```bash
chmod +x build.sh run.sh
./build.sh
```

## Run the Container


```bash
# Basic run
./run.sh

# Or with custom ports
docker run -d -p 8080:80 -p 5433:5432 bpmn-designer:latest

# With volume for data persistence
docker run -d -p 80:80 -v bpmn_data:/var/lib/postgresql/data bpmn-designer:latest
```

Access the Application
Frontend: http://localhost

API: http://localhost/api/health

PostgreSQL: localhost:5432 (user: postgres, no password)



### Check Logs
```bash
docker logs -f bpmn-designer
```

### Stop and Remove
```bash
docker stop bpmn-designer
docker rm bpmn-designer
```

Key Features of This Approach:
1. Single Container Simplicity
One command deployment: Single docker run command

Easy management: One container to start/stop/backup

Reduced complexity: No inter-container networking

2. Production Ready
Process management: Supervisord manages all services

Health checks: Built-in health monitoring

Logging: Centralized logging for all services

Performance: Optimized for single-container deployment

3. Data Persistence
Volume support: PostgreSQL data persists across container restarts

Backup ready: Easy to backup database volume

Configuration: Environment variables for customization

4. Development Friendly
Quick setup: Get everything running with one command

Easy debugging: All logs in one place

Consistent environment: Same setup everywhere

5. Resource Efficient
Small footprint: Alpine Linux base

Optimized layers: Efficient Docker image layers

Minimal overhead: Single container reduces resource usage

This monolithic Docker approach is perfect for:

Development environments

Small to medium deployments

Quick prototyping

When you want simplicity over microservices complexity
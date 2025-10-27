#!/bin/bash
echo "Starting BPMN Designer..."
docker run -d \
  --name bpmn-designer \
  -p 8091:80 \
  -p 54322:5432 \
  -p 5000:5000 \
  -v bpmn_postgres_data:/var/lib/postgresql/data \
  bpmn-designer:latest

echo "BPMN Designer is running!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost/api"
echo "PostgreSQL: localhost:5432"

#!/bin/sh
# start-services.sh

set -e

echo "Starting BPMN Designer Services..."

# Function to wait for PostgreSQL
wait_for_postgres() {
    echo "Waiting for PostgreSQL to start..."
    until pg_isready -h localhost -p 5432; do
        sleep 1
    done
    echo "PostgreSQL is ready"
}

# Function to initialize database
init_database() {
    echo "Initializing database..."
    
    # Create database and tables
    psql -h localhost -U postgres -c "CREATE DATABASE bpmn_designer;" || true
    
    # Initialize schema
    psql -h localhost -U postgres -d bpmn_designer -f /app/backend/init-db.sql
}

# Start PostgreSQL in background
echo "Starting PostgreSQL..."
su postgres -c "postgres -D /var/lib/postgresql/data" &
POSTGRES_PID=$!

# Wait for PostgreSQL to be ready
wait_for_postgres

# Initialize database
init_database

# Start backend (will be managed by supervisord)
echo "Starting Backend API..."
node /app/backend/server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Start nginx (will be managed by supervisord)
echo "Starting Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Use supervisord to manage all processes
echo "Starting Supervisord..."
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

# Keep container running
wait $POSTGRES_PID
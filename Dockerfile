# Use Node.js as base image
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    postgresql15 \
    postgresql15-client \
    postgresql15-contrib \
    nginx \
    supervisor \
    python3 \
    make \
    g++ \
    curl

# Create app directory structure
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy backend source
COPY backend/ ./backend/

# Copy frontend files
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --silent

# Copy frontend source and build
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy configuration files
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start-services.sh /app/start-services.sh

# Create directories for PostgreSQL and Nginx
RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql /var/log/nginx && \
    chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql && \
    chmod -R 755 /var/lib/postgresql /var/run/postgresql

# Initialize PostgreSQL database
USER postgres
RUN initdb -D /var/lib/postgresql/data && \
    echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf && \
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf

# Switch back to root for service management
USER root

# Create startup script
RUN chmod +x /app/start-services.sh

# Expose ports
EXPOSE 80 5432

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start all services
CMD ["/app/start-services.sh"]
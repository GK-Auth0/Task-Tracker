FROM flyway/flyway:latest

# Copy migration files
COPY migrations /flyway/sql

# Set working directory
WORKDIR /flyway

# Default command to run migrations
CMD ["migrate"]
FROM flyway/flyway:latest

# Copy migration files
COPY migrations /flyway/sql

# Set working directory
WORKDIR /flyway

# Default entrypoint will use flyway command
ENTRYPOINT ["flyway"]
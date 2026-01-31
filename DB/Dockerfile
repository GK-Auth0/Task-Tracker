FROM flyway/flyway:latest

# Copy migration files
COPY migrations /flyway/sql

# Set working directory
WORKDIR /flyway

# Create a script to run flyway with proper arguments
RUN echo '#!/bin/sh' > /flyway/run-migrations.sh && \
    echo 'flyway -url="$DATABASE_URL" -locations=filesystem:/flyway/sql migrate' >> /flyway/run-migrations.sh && \
    chmod +x /flyway/run-migrations.sh

# Use the script as entrypoint
ENTRYPOINT ["/flyway/run-migrations.sh"]
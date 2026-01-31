FROM flyway/flyway:latest

# Copy migration files
COPY migrations /flyway/sql

# Set working directory
WORKDIR /flyway

# Create a script to run flyway with debugging
RUN echo '#!/bin/sh' > /flyway/run-migrations.sh && \
    echo 'echo "DATABASE_URL: $DATABASE_URL"' >> /flyway/run-migrations.sh && \
    echo 'echo "Testing connection..."' >> /flyway/run-migrations.sh && \
    echo 'flyway -url="$DATABASE_URL" -locations=filesystem:/flyway/sql info' >> /flyway/run-migrations.sh && \
    echo 'echo "Running migrations..."' >> /flyway/run-migrations.sh && \
    echo 'flyway -url="$DATABASE_URL" -locations=filesystem:/flyway/sql migrate' >> /flyway/run-migrations.sh && \
    chmod +x /flyway/run-migrations.sh

# Use the script as entrypoint
ENTRYPOINT ["/flyway/run-migrations.sh"]
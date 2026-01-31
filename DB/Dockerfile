FROM redgate/flyway:10.10.0

# Copy migration files
COPY migrations /flyway/sql

# Set working directory
WORKDIR /flyway

# Create a script to run flyway
RUN echo '#!/bin/sh' > /flyway/run-migrations.sh && \
    echo 'echo "DATABASE_URL: $DATABASE_URL"' >> /flyway/run-migrations.sh && \
    echo 'flyway -url="$DATABASE_URL" -locations=filesystem:/flyway/sql migrate' >> /flyway/run-migrations.sh && \
    chmod +x /flyway/run-migrations.sh

# Use the script as entrypoint
ENTRYPOINT ["/flyway/run-migrations.sh"]
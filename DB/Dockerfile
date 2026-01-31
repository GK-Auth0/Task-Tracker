FROM openjdk:11-jre-slim

# Install wget and flyway
RUN apt-get update && apt-get install -y wget && \
    wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.22.3/flyway-commandline-9.22.3-linux-x64.tar.gz | tar xvz && \
    ln -s `pwd`/flyway-9.22.3/flyway /usr/local/bin

# Download PostgreSQL JDBC driver
RUN wget -O /flyway-9.22.3/drivers/postgresql.jar https://jdbc.postgresql.org/download/postgresql-42.7.1.jar

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
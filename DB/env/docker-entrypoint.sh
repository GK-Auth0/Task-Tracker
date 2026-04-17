#!/bin/bash
./wait-for-it.sh -s -t 150 $POSTGRES_HOST:$POSTGRES_PORT

URL="jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB?useSSL=false&allowPublicKeyRetrieval=true"

echo "---------- running migrations ----------"
FLYWAY_URL="$URL" \
FLYWAY_USER="$POSTGRES_USER" \
FLYWAY_PASSWORD="$POSTGRES_PASSWORD" \
FLYWAY_SQL_ROOT="./migrations" \
./run-migrations.sh

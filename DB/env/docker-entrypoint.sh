#!/bin/bash
./wait-for-it.sh -s -t 150 $POSTGRES_HOST:$POSTGRES_PORT

URL="jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB?useSSL=false&allowPublicKeyRetrieval=true"

echo "---------- running migrations ----------"
flyway -schemas="public" -user=$POSTGRES_USER -password=$POSTGRES_PASSWORD -url=$URL -locations=filesystem:./migrations/schema,filesystem:./migrations/seeder,filesystem:./migrations/views -outOfOrder=true migrate
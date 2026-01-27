FROM flyway/flyway:latest

COPY ./env/wait-for-it.sh ./wait-for-it.sh
COPY ./env/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod 755 ./*.sh

COPY ./migrations ./migrations

ENTRYPOINT ["./docker-entrypoint.sh"]
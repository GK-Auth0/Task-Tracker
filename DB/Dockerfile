FROM flyway/flyway:12

COPY migrations /flyway/sql
COPY flyway.conf /flyway/conf/flyway.conf
COPY run-migrations.sh /flyway/run-migrations.sh

RUN chmod 755 /flyway/run-migrations.sh

CMD ["/flyway/run-migrations.sh"]

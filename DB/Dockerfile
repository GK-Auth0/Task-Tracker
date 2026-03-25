FROM flyway/flyway:12

COPY migrations /flyway/sql
COPY flyway.conf /flyway/conf/flyway.conf

CMD ["migrate"]

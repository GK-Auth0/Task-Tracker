FROM flyway/flyway:10-alpine

COPY migrations/ /flyway/sql/
COPY flyway.conf /flyway/conf/

CMD ["migrate"]
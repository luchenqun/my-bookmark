FROM luchenqun/ubuntu-mysql-node
LABEL maintainer="luchenqun@qq.com"

RUN mkdir -p /app
COPY src /app/src
COPY view /app/view
COPY www /app/www
COPY package.json /app/package.json
COPY production.js /app/production.js
COPY schema.sql /app/schema.sql

WORKDIR /app
RUN sed -i 's/test/root/g' /app/src/config/adapter.js \
  && sed -i 's/123456//g' /app/src/config/adapter.js \
  && npm install \
  && service mysql start \
  && mysql -u root < /app/schema.sql

EXPOSE  3306
EXPOSE  2000
CMD ["node production.js"]
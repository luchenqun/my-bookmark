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
RUN npm install && service mysql start && mysql -u root < /app/schema.sql

EXPOSE  3306
EXPOSE  2000
CMD ["node production.js"]
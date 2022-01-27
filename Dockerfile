FROM luchenqun/ubuntu-mysql-node
LABEL maintainer="luchenqun@qq.com"

RUN mkdir -p /app
COPY src /app/src
COPY view /app/view
COPY package.json /app/package.json
COPY production.js /app/production.js
COPY schema.sql /app/schema.sql

WORKDIR /app
RUN USER=`sed -n '4,4p' /etc/mysql/debian.cnf | awk  'BEGIN { FS = "= " } ; { print $2 }'` \
  && sed -i "s/test/${USER}/" /app/src/config/adapter.js \
  && PASSWORD=`sed -n '5,5p' /etc/mysql/debian.cnf | awk  'BEGIN { FS = "= " } ; { print $2 }'` \
  && sed -i "s/123456/${PASSWORD}/g" /app/src/config/adapter.js \
  && npm install --production \
  && touch /usr/local/bin/start.sh \
  && chmod 777 /usr/local/bin/start.sh \
  && echo "#!/bin/bash" >> /usr/local/bin/start.sh \
  && echo "service mysql restart" >> /usr/local/bin/start.sh \
  && echo "mysql -u root < /app/schema.sql" >> /usr/local/bin/start.sh \
  && echo "node /app/production.js" >> /usr/local/bin/start.sh

EXPOSE  3306
EXPOSE  2000

ENTRYPOINT ["start.sh"]

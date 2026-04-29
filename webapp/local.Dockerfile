FROM node:20

RUN apt-get update && apt-get install tini

ENV APP_HOME="/usr/src/app"
WORKDIR ${APP_HOME}
COPY . ${APP_HOME}/

RUN npm install
RUN npm run build:be
RUN npm run build:fe

ENTRYPOINT ["tini", "--"]

CMD ["node", "./dist/backend/server.js"]

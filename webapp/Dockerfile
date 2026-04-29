FROM node:20-slim

RUN apt-get update && apt-get install tini

ENV APP_HOME="/usr/src/app"
COPY . ${APP_HOME}/
WORKDIR ${APP_HOME}/

ENTRYPOINT ["tini", "--"]

CMD ["node", "./dist/backend/server.js"]

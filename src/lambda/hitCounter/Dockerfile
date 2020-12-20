FROM public.ecr.aws/lambda/nodejs:12

ARG FUNCTION_DIR="/var/task/"

RUN mkdir -p ${FUNCTION_DIR}

COPY ./dist/app.js ./package*.json ${FUNCTION_DIR}
RUN npm install

CMD [ "app.handler" ]
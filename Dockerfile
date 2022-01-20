FROM node:alpine

COPY . .
RUN yarn

CMD ["yarn", "start"]

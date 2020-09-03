FROM node:12

#RUN apt-get update || : && apt-get install python -y
RUN mkdir /home/node/app
WORKDIR /home/node/app

EXPOSE 80
CMD [ "npm", "run", "dev" ]

COPY package*.json ./
RUN npm ci
COPY . .

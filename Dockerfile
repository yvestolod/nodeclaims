FROM node:12
WORKDIR /nodeclaims
COPY package.json /nodeclaims
RUN npm install
COPY . /nodeclaims
CMD node nodeclaims.js
EXPOSE 8082

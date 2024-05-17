FROM node:18
COPY . /app
WORKDIR /app
# RUN npm install webpack
# RUN npm install -D webpack-cli
RUN npm install
RUN npm run build
RUN npm install serve
CMD ["npx", "serve", "-s", "build", "-p", "3000"]

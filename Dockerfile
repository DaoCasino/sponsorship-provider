FROM node:12

ARG PORT=3000
ENV PORT=${PORT}

WORKDIR /tool

RUN cd /tool

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN echo "deb http://security.debian.org/debian-security jessie/updates main" >> /etc/apt/sources.list
RUN apt-get update -y && apt-get install -y --no-install-recommends libssl1.0.0
RUN ln -s /usr/lib/x86_64-linux-gnu/libcrypto.so.1.0.0 /usr/lib/libcrypto.so.1.0.0

ENTRYPOINT ["npm", "run", "start", "--"]
EXPOSE ${PORT}
CMD []

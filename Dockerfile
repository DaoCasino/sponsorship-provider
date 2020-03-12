FROM node:12

# install openssl for signature provider
RUN apt-get update \
	&& apt-get install -y libssl1.0.0 \
	&& rm -rf /var/lib/apt/lists/* \
	&& rm -rf /var/cache/apt/*

ARG PORT=3000
ENV PORT=${PORT}

WORKDIR /tool

RUN cd /tool

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENTRYPOINT ["npm", "run", "start", "--"]
EXPOSE ${PORT}
CMD []

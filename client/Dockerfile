FROM denoland/deno:alpine-2.4.3

WORKDIR /app

COPY package.json .

RUN DENO_FUTURE=1 deno install --allow-scripts

COPY . .

CMD [ "task", "dev", "--host" ]
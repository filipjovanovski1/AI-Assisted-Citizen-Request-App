FROM node:18-alpine AS builder

WORKDIR /app

COPY web/package*.json ./ 

RUN npm ci

COPY web/ .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /var/cache/nginx && chown -R nginx:nginx /var/cache/nginx

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM node:18-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Üretim aşaması
FROM nginx:alpine

# NGINX yapılandırmasını kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx Yapılandırması
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"] 
FROM php:8.3-cli-alpine

WORKDIR /app

# System dependencies
RUN apk add --no-cache \
    nodejs npm \
    sqlite sqlite-dev \
    libzip-dev zip unzip \
    curl \
    && docker-php-ext-install pdo pdo_sqlite zip

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy project
COPY . .

# PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# JS/CSS build
RUN npm ci && npm run build && rm -rf node_modules

# App setup
RUN cp .env.demo .env \
    && php artisan key:generate --force \
    && touch database/database.sqlite \
    && php artisan migrate --force \
    && php artisan db:seed --force \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]

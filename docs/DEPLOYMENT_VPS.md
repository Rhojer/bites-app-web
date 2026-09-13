# Guía de Despliegue en VPS (Ubuntu/Debian) en /var/www/

Esta guía describe el paso a paso para desplegar **Bites App Web** en `/var/www/bites-app-web` y servirlo en la ruta raíz (`/`) con **Node.js 20+**, **PM2** y **Nginx**.

---

## 1. Preparación del Servidor (Solo la primera vez)

```bash
# Actualizar repositorios
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x y Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Instalar PM2 globalmente
sudo npm install -g pm2
```

---

## 2. Clonar el Proyecto en `/var/www/bites-app-web`

```bash
# Crear directorio y asignar permisos
sudo mkdir -p /var/www/bites-app-web
sudo chown -R $USER:$USER /var/www/bites-app-web

# Clonar repositorio
git clone https://github.com/Rhojer/bites-app-web.git /var/www/bites-app-web
cd /var/www/bites-app-web

# Instalar dependencias
npm install
```

---

## 3. Variables de Entorno

Crear el archivo `.env.local` con las credenciales de Supabase y configuración:

```bash
nano /var/www/bites-app-web/.env.local
```

Contenido necesario:
```env
NEXT_PUBLIC_SUPABASE_URL=https://uqvdopbegosjggkxamoo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...tu_anon_key...
PORT=3000
NODE_ENV=production
```

---

## 4. Compilar y Levantar con PM2

```bash
cd /var/www/bites-app-web

# Compilar la aplicación Next.js
npm run build

# Iniciar proceso con PM2
pm2 start ecosystem.config.js

# Guardar configuración para reinicios automáticos
pm2 save
pm2 startup
```

---

## 5. Configurar Nginx para Servir en `/`

Crear o editar la configuración en `/etc/nginx/sites-available/bites-app`:

```nginx
server {
    listen 80;
    server_name tu-dominio-o-ip;

    # Proxy a Next.js (PM2 en puerto 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optimización para assets estáticos de Next.js
    location /_next/static {
        proxy_cache_valid 200 1y;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

Habilitar el sitio y reiniciar Nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/bites-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Script de Actualizaciones Futuras (Deploy continuo)

```bash
#!/bin/bash
cd /var/www/bites-app-web
git pull origin main
npm install
npm run build
pm2 reload bites-app-web
echo "Despliegue completado con éxito."
```

#!/bin/bash

set -e

if [ ! -e /config/packagelist.config.json ]; then
    echo "[WARNING] packagelist.config.json is missing, this is normal for the first launch! Copying template." | ts '%Y-%m-%d %H:%M:%.S'
    cp /assets/packagelist.config.json.example /config/packagelist.config.json
    chown builder /config/packagelist.config.json
    chmod 755 /config/packagelist.config.json
fi

# Start NGINX
echo "[INFO] Starting NGINX..." | ts '%Y-%m-%d %H:%M:%.S'
/usr/bin/nginx -g 'daemon off;' &
chmod -R 755 /etc/nginx /usr/share/nginx/html

# Remove index.html if it exists
if [ -e /usr/share/nginx/html/index.html ]; then
    echo "[INFO] Removing default index.html..." | ts '%Y-%m-%d %H:%M:%.S'
    rm /usr/share/nginx/html/index.html
    rm /usr/share/nginx/html/50x.html
fi

# Conditionally add Traefik labels if BASE_URL is set
if [ -n "$BASE_URL" ]; then
    echo "[INFO] Traefik integration enabled for BASE_URL: $BASE_URL" | ts '%Y-%m-%d %H:%M:%.S'

    if [ -n "$TRAEFIK_NETWORK" ]; then
        echo "[INFO] Using TRAEFIK NETWORK: $TRAEFIK_NETWORK" | ts '%Y-%m-%d %H:%M:%.S'
    else
        echo "[INFO] Using default TRAEFIK_NETWORK: traefik-reverse-proxy" | ts '%Y-%m-%d %H:%M:%.S'
    fi

    # Create Traefik labels dynamically
    cat > /etc/nginx/conf.d/traefik.conf <<EOL
    # Traefik Configuration
    traefik.enable=true
    traefik.docker.network=\`${TRAEFIK_NETWORK:-traefik-reverse-proxy}\`
    traefik.http.routers.docker-aur-cache-nginx.rule=Host(\`${BASE_URL}\`)
    traefik.http.routers.docker-aur-cache-nginx.entrypoints=http
    traefik.http.routers.docker-aur-cache-nginx.tls=false
EOL

    # Reload NGINX to apply any new configuration
    nginx -s reload
else
    echo "[INFO] No custom BASE_URL found, skipping Traefik labels" | ts '%Y-%m-%d %H:%M:%.S'
fi

# Wait for NGINX to start and grab the NGINX pid
nginxpid=$(cat /var/run/nginx.pid)

# Optionally, log the NGINX pid for debugging
echo "[INFO] NGINX started with PID: $nginxpid" | ts '%Y-%m-%d %H:%M:%.S'

# Start the build manager
echo "[INFO] Starting the build manager..." | ts '%Y-%m-%d %H:%M:%.S'
fcrontab -u nobody /assets/fcron_builder.tab
fcrontab -u nobody -l
echo "[INFO] Build manager started!" | ts '%Y-%m-%d %H:%M:%.S'

tail -f /dev/null
# Use the official Arch Linux base-devel image
FROM archlinux:base-devel

# Set the working directory
WORKDIR /opt

# Create the necessary directories
RUN mkdir -p /etc/nginx /build-manager /builder /assets /config /usr/share/nginx/html

# Initialize pacman keys and update the package database
RUN pacman-key --init && \
    pacman -Sy --noconfirm archlinux-keyring

# Install necessary packages
RUN pacman -Syu --noconfirm \
    nginx \
    fcron \
    git \
    nodejs-lts-iron \
    npm \
    moreutils

# Install the builder-manager package
COPY builder-manager /opt/builder-manager

# Install the builder-manager package
RUN cd /opt/builder-manager/build-manager && \
    npm install && \
    npm run build && \
    mv /opt/builder-manager/build-manager /

# Move builder package
RUN mv /opt/builder-manager/builder /

# Remove the builder-manager package
RUN rm -r /opt/builder-manager

# Copy the assets to the container
COPY builder-manager/assets /assets

# Copy a custom nginx.conf to the container (with updated settings)
RUN cp /assets/nginx-default.conf /etc/nginx/nginx.conf

# Copy the start script to the container
COPY start.sh /start.sh

# Expose port 80 for NGINX
EXPOSE 80

# Create the builder user
ENV PUID=12345
ENV DOCKER_PGID=969
RUN groupadd -g ${DOCKER_PGID} dockerindocker \
    && useradd -u ${PUID} -g ${DOCKER_PGID} -ms /bin/bash builder

# Set ownership and permissions
RUN chown -R builder /config /build-manager /builder /assets \
    && chmod -R 750 /config /build-manager /builder /assets

# Make start executable
RUN chmod +x /start.sh /assets/*.sh

# Run Docker-in-Docker with isolated Docker daemon (DinD)
CMD ["/bin/bash", "/start.sh"]
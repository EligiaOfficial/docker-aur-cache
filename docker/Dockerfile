FROM --platform=linux/amd64 archlinux:multilib-devel

# Update the image and install dependencies
# TODO: Install NVM instead of NodeJS
RUN pacman-key --init
RUN pacman -Syu --noconfirm git base-devel fcron nodejs npm

# Create the builder user
RUN useradd -ms /bin/bash builder
RUN usermod -a -G fcron builder
RUN chmod o+x /usr/sbin/fcron
RUN echo "builder ALL=(ALL) NOPASSWD:/usr/bin/pacman -S --noconfirm *, /usr/bin/pacman -U --noconfirm *, /usr/bin/pacman -Fy *" >> /etc/sudoers
USER builder
RUN mkdir -p /home/builder
WORKDIR /home/builder

# Build builder application
USER builder
COPY ./builder /builder
USER root
RUN chown -R builder /builder
USER builder
WORKDIR /builder
RUN npm install && npm run build

# Copy script
USER root
COPY ./docker/build-packages.sh /repository-builder/
RUN chmod 777 /repository-builder/build-packages.sh
USER builder

# Configure fcron
USER root
COPY ./docker/fcron_builder.tab /tmp/
COPY ./docker/fcron_root.tab /tmp/
RUN fcrontab -u builder /tmp/fcron_builder.tab
RUN fcrontab -u root /tmp/fcron_root.tab

WORKDIR /repository-builder
RUN chmod 777 /repository-builder

CMD ["fcron", "--foreground", "--firstsleep", "0"]

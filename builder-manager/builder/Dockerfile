# Use the official Arch Linux base-devel image
FROM archlinux:multilib-devel

# Initialize pacman keys and update the package database
RUN pacman-key --init && \
    pacman -Sy --noconfirm archlinux-keyring

# Install necessary packages
RUN pacman -Syu --noconfirm \
    git \
    nodejs-lts-iron \
    npm \
    fcron

# Create the necessary directories
RUN mkdir -p /package-staging /aur-package-list /repository-builder

# Create the builder user
ENV PUID=12345
RUN useradd -u ${PUID} -ms /bin/bash builder
RUN echo "builder ALL=(ALL) NOPASSWD:/usr/bin/pacman -S --noconfirm *, /usr/bin/pacman -U --noconfirm *, /usr/bin/pacman -Fy *" >> /etc/sudoers
USER builder
RUN mkdir -p /home/builder
WORKDIR /home/builder

# Build builder application
USER root
COPY . /builder
RUN chown -R builder /builder /package-staging /aur-package-list /repository-builder
USER builder
WORKDIR /builder
RUN npm install && npm run build

WORKDIR /repository-builder
USER root
RUN chmod 755 /repository-builder
USER builder

CMD ["tail", "-f", "/dev/null"]
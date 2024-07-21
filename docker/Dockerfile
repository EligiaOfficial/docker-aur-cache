FROM archlinux:latest

# Update the image and install dependencies
RUN pacman-key --init
RUN pacman -Syu --noconfirm git base-devel fcron

# Create the builder user
RUN useradd -ms /bin/bash builder
RUN usermod -a -G fcron builder
RUN chmod o+x /usr/sbin/fcron
RUN echo "builder ALL=(ALL) NOPASSWD:/usr/bin/pacman -S --noconfirm *, /usr/bin/pacman -U --noconfirm *" >> /etc/sudoers
USER builder
RUN mkdir -p /home/builder
WORKDIR /home/builder

# Install YAY
RUN git clone https://aur.archlinux.org/yay.git;
WORKDIR /home/builder/yay
USER root
RUN source ./PKGBUILD && pacman -Syu --noconfirm --needed --asdeps "${makedepends[@]}" "${depends[@]}"
USER builder
RUN makepkg
USER root
RUN pacman -U --noconfirm yay-*.pkg.tar.zst
USER builder

# TODO: Copy over and compile the package builder

# Copy script
COPY ./docker/build-packages.sh /repository-builder/

# Configure fcron
USER root
COPY ./docker/fcron_builder.tab /tmp/
COPY ./docker/fcron_root.tab /tmp/
RUN fcrontab -u builder /tmp/fcron_builder.tab
RUN fcrontab -u root /tmp/fcron_root.tab

WORKDIR /repository-builder
RUN chmod 777 /repository-builder

CMD ["fcron", "--foreground", "--firstsleep", "0"]

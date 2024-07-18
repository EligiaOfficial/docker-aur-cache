FROM archlinux:latest

# Update the image and install dependencies
RUN pacman-key --init
RUN pacman -Syu --noconfirm git base-devel fcron

# Create the builder user
RUN useradd -ms /bin/bash builder
RUN usermod -a -G fcron builder
RUN chmod o+x /usr/sbin/fcron
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

# Configure fcron
USER root
COPY ./docker/fcron.tab /tmp/
RUN fcrontab -u builder /tmp/fcron.tab
COPY ./docker/test.sh /tmp/

WORKDIR /repository-builder

CMD ["fcron", "--foreground", "--firstsleep", "0"]

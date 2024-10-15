# Docker AUR Cache
Docker image that automatically builds AUR packages and hosts them for faster installation on client devices.

## Setup (Container)
1. Make sure you meet the follow prerequisites
    - Docker + Docker Compose have been installed
    - The [Traefik reverse proxy container](https://github.com/CrazyVito11/traefik-reverse-proxy) has been configured
    - A registered domain name
        - You can use something like [PiHole](https://github.com/pi-hole/pi-hole) to register local domains if you aren't going to host it publicly
2. Clone this repository to your server
3. Make a copy of `packagelist.txt.example` and call it `packagelist.txt`
4. Add the packages you want to provide to the `packagelist.txt` file
5. Update the repository permissions with `chmod 777 ./repository`
    - **Note:** We are aware that this isn't very secure, this will be improved in the future.
6. Build the container with `docker compose build`

_**TODO:** Add instructions about a .env file, so the user can configure the domain and docker GID if needed_

The container should now be ready, simply start it with `docker compose up -d` and try visiting your domain!

> [!INFO]
> Normally you would have to wait until Sunday @ 01:00 for it to start building, but instructions are available in case you want to start the build immediately.
> See the section **Force the build immediately** for more information.

## Setup (Client)
To configure Pacman to use your self-hosted repository, open your `/etc/pacman.conf` file and add the following repository:

```
[docker-aur-cache]
SigLevel = Optional
Server = http://docker-aur-cache.localhost/
```

> [!NOTE]
> Don't forget to update the URL to your configured URL.

And that should be it!
Simply perform a full system update and you should be able to install packages that are hosted by your instance.

## Tips
### Force the build immediately
If you want the container to start building right now, you can run these commands to accomplish that:

1. `docker compose exec --user builder build-manager bash`
2. `./build-packages.sh`

It should now start building your packages, wait for this process to finish and then you can install the packages you configured.

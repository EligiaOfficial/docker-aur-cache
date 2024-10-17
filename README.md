# Docker AUR Cache
Docker image that automatically builds AUR packages and hosts them for faster installation on client devices.


## Setup (Container)
1. Make sure you meet the follow prerequisites
    - Docker + Docker Compose have been installed
    - The [Traefik reverse proxy container](https://github.com/CrazyVito11/traefik-reverse-proxy) has been configured
    - A registered domain name
        - You can use something like [PiHole](https://github.com/pi-hole/pi-hole) to register local domains if you aren't going to host it publicly
> [!TIP]
> While this container was designed to work with Traefik and a domain name, with a couple of tweaks you can bind to a TCP port instead.
> See the section **Bind NGINX to port instead of Traefik** for instructions.
2. Clone this repository to your server
3. Make a copy of `packagelist.json.example` and call it `packagelist.json`
4. Add the packages you want to provide to the `packagelist.json` file
    - You can find documentation about this file at section **Configure packagelist**.
5. Update the repository permissions with `chmod 777 ./repository`
    - **Note:** We are aware that this isn't very secure, this will be improved in the future.
6. Build the container with `docker compose build`
7. Start the container with `docker compose up -d`
8. Set the right permissions with `docker compose exec build-manager chown builder /package-staging`

_**TODO:** Add instructions about a .env file, so the user can configure the domain and docker GID if needed_

The container should now be ready, try visiting your domain and you should see a index page!
This page will also show packages that are available for downloading.

> [!TIP]
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


## Configure packagelist
The `packagelist.json` file is a JSON formatted file that will be used to configure which packages you want to build, and the specific tweaks they might need to build properly.
Each package that you want to build, will be it's own object inside the array.

### Package object description
| **Field**                | **Required** | **Type**               | **Description**                                                                                                            |
|--------------------------|--------------|------------------------|----------------------------------------------------------------------------------------------------------------------------|
| `packageName`            | Yes          | `string`               | Defines the name of the AUR package that should be build.                                                                  |
| `resolveDependenciesAs`  | No           | `object`               | A key-value mapping where the key is the original dependency, and the value is the replacement package that should be used.|
| `runCommandsBeforeBuild` | No           | `array of strings`     | An array of shell commands to be executed before the package build process starts.                                         |

> [!TIP]
> The build process is executed in a separate container for each AUR package, which is destroyed after the build is complete.
> If you for example run a command for `package-a` to import a key that `package-b` will also need, you will have to add that command also to the configuration of `package-b`.


## Tips
### Force the build immediately
If you want the container to start building right now, you can run these commands to accomplish that:

1. `docker compose exec --user builder build-manager bash`
2. `./build-packages.sh`

It should now start building your packages, wait for this process to finish and then you can install the packages you configured.

### Bind NGINX to port instead of Traefik
While it's intended to be used with my Traefik container, it does increase the steps needed to get this application up and running, and it might not even be possible in certain situations.

With a couple of modifications to the `docker-compose.yml` file you can skip the need for Traefik and a domain name, and just connect directly to a TCP port instead.

1. Remove the entire `networks` section at the bottom, as we no longer need that external network.
2. Remove the `labels` section from the `nginx` container.
3. Remove the `traefik-reverse-proxy` network from the `nginx` container.
4. Add a `ports` section to the `nginx` container and bind the port you want to use to `80` on the container.
    - **Example:** `- 8080:80` to bind it to port `8080` on your host machine.

It should now be accessible on your desired TCP port without having to set up my Traefik configuration as well.

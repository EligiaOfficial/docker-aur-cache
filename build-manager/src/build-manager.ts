import fs from 'fs';
import readline from 'readline';
import Docker from 'dockerode';
import { execSync } from 'child_process';
import ParameterHelper from './Helpers/ParameterHelper';
import BuilderHelper from './Helpers/BuilderHelper';
import DockerHelper from './Helpers/DockerHelper';
import TimeHelper from './Helpers/TimeHelper';

const params = ParameterHelper.getParameters();
const docker = new Docker({socketPath: '/var/run/docker.sock'});

if (! ParameterHelper.validateRequiredParameters(params)) {
    console.error("Required parameters are missing or invalid");

    process.exit(1);
}

console.log(`[build-manager] Builder image name: ${params.builder_image_name}`);
console.log(`[build-manager] Packagelist path: ${params.packagelist_path}`);
console.log(`[build-manager] Builder directory: ${params.builder_dir}`);
console.log(`[build-manager] Repository directory: ${params.repository_dir}`);
console.log(`[build-manager] Repository name: ${params.repository_name}`);



const removeOldDockerImage = async () => {
    console.log("[build-manager] Removing old builder Docker images");

    const dockerImages = await docker.listImages({
        filters: {
            reference: [
                params.builder_image_name
            ]
        }
    });

    dockerImages.forEach(dockerImage => {
        console.log(`[build-manager] Removing Docker image ID ${dockerImage.Id}`);

        docker.getImage(dockerImage.Id).remove({ force: true })
    });

    console.log("[build-manager] Old builder Docker images have been removed");
}

const buildNewDockerImage = async () => {
    console.log("[build-manager] Building a fresh builder Docker image");

    const buildSteam = await docker.buildImage(
        {
            src: DockerHelper.getAllFilesInDirectoryWithoutDockerignore(params.builder_dir),
            context: params.builder_dir
        },
        {
            version: "1",
            t: params.builder_image_name,
            nocache: true,
            forcerm: true,
            rm: true,
        }
    );

    await new Promise<void>((resolve, reject) => {
        docker.modem.followProgress(
            buildSteam,
            (_, res) => {
                const lastConsoleResponse = res.reverse()[0];

                if (lastConsoleResponse && 'error' in lastConsoleResponse) {
                    reject();

                    return;
                }

                resolve();
            },
            (progress) => 'stream' in progress ? process.stdout.write(progress.stream) : null
        );
    });

    console.log("[build-manager] Builder Docker image is ready!");
}

const stopAllBuilderInstances = async () => {
    console.log("[build-manager] Stopping old builder containers");

    const dockerImages = await docker.listImages({
        filters: {
            reference: [
                params.builder_image_name
            ]
        }
    });

    const containers = await docker.listContainers();

    for (const dockerImage of dockerImages) {
        for (const container of containers) {
            if (container.ImageID === dockerImage.Id) {
                console.log(`[build-manager] Stopping container ${container.Id}`);

                await docker.getContainer(container.Id).remove({ force: true });
            }
        }
    }

    console.log("[build-manager] Old builder containers have been stopped");
}

const prepareAurPackageList = async (): Promise<string> => {
    console.log("[build-manager] Preparing the AUR package list");

    execSync(`cd /tmp; curl https://aur.archlinux.org/packages-meta-ext-v1.json.gz -O; gzip -d packages-meta-ext-v1.json.gz; ls -al packages-meta-ext-v1.json`);

    console.log("[build-manager] The AUR package list is ready");

    return '/tmp/packages-meta-ext-v1.json';
}

const moveOldPackagesToArchive = async () => {
    console.log("[build-manager] Moving old packages to the archive");

    // TODO: Implement this

    console.log("[build-manager] Old packages have been archived");
}

const publishBuildPackages = async () => {
    try {
        console.log("[build-manager] Copying new packages");
        execSync(`mv ${params.package_staging_dir}/*.pkg.tar.zst ${params.repository_dir}/`);
    } catch (e) {
        console.warn(`[build-manager] Unable to move packages, maybe there are no packages available?`);
        console.warn(e);

        return;
    }

    console.log("[build-manager] Removing old database (if it exists)");
    execSync(`rm -f ${params.repository_dir}/${params.repository_name}.db* ${params.repository_dir}/${params.repository_name}.files*`);

    console.log("[build-manager] Adding packages to database");
    execSync(`repo-add ${params.repository_dir}/${params.repository_name}.db.tar.gz ${params.repository_dir}/*.pkg.tar.zst`);
}

const handlePackageList = async (aurPackageListPath: string) => {
    const fileStream = fs.createReadStream(params.packagelist_path);

    // TODO: Replace this with a JSON based configuration file to allow more flexibility (manually selecting the source of a provided packages, forcing clean builds, running commands beforehand, etc...)
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const packageName of rl) {
        console.log(`[build-manager] Processing "${packageName}"`);

        const packageBuildStartTime = new Date();

        try {
            const command = BuilderHelper.getBuilderStartCommand(aurPackageListPath, packageName);

            console.log(`[build-manager] Starting the container with the following command: ${command}`);

            const container = await docker.createContainer({
                Image: params.builder_image_name,
                AttachStdout: true,
                AttachStderr: true,
                User: 'builder',
                Cmd: ['/bin/bash', '-c', command],
                HostConfig: {
                    Mounts: BuilderHelper.getBuilderMounts(aurPackageListPath)
                }
            });

            await container.start();

            container.attach({stream: true, stdout: true, stderr: true}, function (_, stream) {
                container.modem.demuxStream(stream, process.stdout, process.stderr);
            });

            // Wait for the container to finish it's job
            await container.wait();

            await container.remove();
        } catch (e) {
            // TODO: Collect as much information as possible about the error and then write it to a report (in HTML maybe?)
            console.error(`[build-manager] Something went wrong while building`, e);

            // We are not sure if the container also stopped properly
            // So with this we are sure that no builders are still running
            await stopAllBuilderInstances();
        }

        const packageBuildEndTime = new Date();
        const formattedTime = TimeHelper.getFormattedTimeDifference(packageBuildStartTime, packageBuildEndTime);

        console.log(`[build-manager] Done processing "${packageName}", Building took ${formattedTime}`);
    }
}

const startBuilding = async () => {
    const aurPackageListPath = await prepareAurPackageList();

    await stopAllBuilderInstances();
    await removeOldDockerImage();
    await buildNewDockerImage();

    await handlePackageList(aurPackageListPath);

    await moveOldPackagesToArchive();
    await publishBuildPackages();
}

const startTime = new Date();

startBuilding().then(() => {
    const endTime = new Date();
    const formattedTime = TimeHelper.getFormattedTimeDifference(startTime, endTime);

    console.log(`[build-manager] We are done here! Building took ${formattedTime}`);
});

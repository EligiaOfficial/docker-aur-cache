import fs from 'fs';
import readline from 'readline';
import Docker from 'dockerode';
import ParameterHelper from './Helpers/ParameterHelper';
import DockerHelper from './Helpers/DockerHelper';
import { execSync } from 'child_process';

const params = ParameterHelper.getParameters();
const docker = new Docker({socketPath: '/var/run/docker.sock'});

if (! ParameterHelper.validateRequiredParameters(params)) {
    console.error("Required parameters are missing or invalid");

    process.exit(1);
}

console.log(`Builder image name: ${params.builder_image_name}`);
console.log(`Packagelist path: ${params.packagelist_path}`);
console.log(`Builder directory: ${params.builder_dir}`);
console.log(`Repository directory: ${params.repository_dir}`);
console.log(`Repository name: ${params.repository_name}`);



const removeOldDockerImage = async () => {
    console.log("[Builder] Removing old builder Docker images");

    const dockerImages = await docker.listImages({
        filters: {
            reference: [
                params.builder_image_name
            ]
        }
    });

    dockerImages.forEach(dockerImage => {
        console.log(`[Builder] Removing Docker image ID ${dockerImage.Id}`);

        docker.getImage(dockerImage.Id).remove({ force: true })
    });

    console.log("[Builder] Old builder Docker images have been removed");
}

const buildNewDockerImage = async () => {
    console.log("[Builder] Building a fresh builder Docker image");

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

    console.log("[Builder] Builder Docker image is ready!");
}

const moveOldPackagesToArchive = async () => {
    console.log("[Builder] Moving old packages to the archive");

    // TODO: Implement this
}

const publishBuildPackages = async () => {
    console.log("[Builder] Copying new packages");
    execSync(`cp ${params.package_staging_dir}/**/*.pkg.tar.zst ${params.repository_dir}/`);

    console.log("[Builder] Removing old database (if it exists)");
    execSync(`rm -f ${params.repository_dir}/${params.repository_name}.db* ${params.repository_dir}/${params.repository_name}.files*`);

    console.log("[Builder] Adding packages to database");
    execSync(`repo-add ${params.repository_dir}/${params.repository_name}.db.tar.gz ${params.repository_dir}/*.pkg.tar.zst`);
}

const handlePackageList = async () => {
    const fileStream = fs.createReadStream(params.packagelist_path);

    // TODO: Replace this with a JSON based configuration file to allow more flexibility (manually selecting the source of a provided packages, forcing clean builds, running commands beforehand, etc...)
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const packageName of rl) {
        console.log(`[Builder] Processing "${packageName}"`);

        console.log('TODO: Implement building via the builder container');

        console.log(`[Builder] Done processing "${packageName}"`);
    }
}

const startBuilding = async () => {
    await removeOldDockerImage();
    await buildNewDockerImage();

    //await handlePackageList();

    //await moveOldPackagesToArchive();
    //await publishBuildPackages();
}

const startTime = new Date();

startBuilding().then(() => {
    const endTime = new Date();
    const timeDiff = endTime.getTime() - startTime.getTime();
    const formattedTime = timeDiff / 1000;

    console.log(`[Builder] We are done here! Building took ${formattedTime} seconds`);
});

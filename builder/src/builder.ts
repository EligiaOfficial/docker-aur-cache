import fs from 'fs';
import readline from 'readline';
import PackageHelper from './Helpers/PackageHelper';
import ParameterHelper from './Helpers/ParameterHelper';
import { execSync } from 'child_process';

const params = ParameterHelper.getParameters();

if (! ParameterHelper.validateRequiredParameters(params)) {
    console.error("Required parameters are missing or invalid");

    process.exit(1);
}

console.log(`Packagelist path: ${params.packagelist_path}`);
console.log(`Build directory: ${params.build_dir}`);
console.log(`Repository directory: ${params.repository_dir}`);
console.log(`Repository name: ${params.repository_name}`);



const moveOldPackagesToArchive = async () => {
    console.log("[Builder] Moving old packages to the archive");

    // TODO: Implement this
}

const publishBuildPackages = async () => {
    console.log("[Builder] Copying new packages");
    execSync(`cp ${params.build_dir}/**/*.pkg.tar.zst ${params.repository_dir}/`);

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

        try {
            await PackageHelper.packageDependencyHandler(
                params.build_dir,
                packageName
            );
        } catch (e) {
            console.error(`[Builder] Unable to process package because of an uncaught exception`);
            console.error(e);

            continue;
        }

        console.log(`[Builder] Done processing "${packageName}"`);
    }

    await moveOldPackagesToArchive();
    await publishBuildPackages();
}

handlePackageList();

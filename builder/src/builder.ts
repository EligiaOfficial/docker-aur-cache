import fs from 'fs';
import readline from 'readline';
import PackageHelper from './Helpers/PackageHelper';
import ParameterHelper from './Helpers/ParameterHelper';

const params = ParameterHelper.getParameters();

if (! ParameterHelper.validateRequiredParameters(params)) {
    console.error("Required parameters are missing or invalid");

    process.exit(1);
}

console.log(`Packagelist path: ${params.packagelist_path}`);
console.log(`Build directory: ${params.build_dir}`);
console.log(`Repository directory: ${params.repository_dir}`);

const handlePackageList = async () => {
    const fileStream = fs.createReadStream(params.packagelist_path);

    // TODO: Replace this with a JSON based configuration file to allow more flexibility (manually selecting the source of a provided packages, forcing clean builds etc)
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
}

handlePackageList();

// TODO: Update the repository directory to actually "publish" the packages

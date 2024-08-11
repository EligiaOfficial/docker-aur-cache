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

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const packageName of rl) {
        console.log(`Processing "${packageName}"`);

        await PackageHelper.packageDependencyHandler(
            params.build_dir,
            packageName
        );

        console.log(`Done processing "${packageName}"`);
    }
}

handlePackageList();

// TODO: Update the repository directory to actually "publish" the packages

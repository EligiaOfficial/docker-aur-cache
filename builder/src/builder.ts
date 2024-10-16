import PackageHelper from './Helpers/PackageHelper';
import ParameterHelper from './Helpers/ParameterHelper';
import { execSync } from 'child_process';

const params = ParameterHelper.getParameters();

if (! ParameterHelper.validateRequiredParameters(params)) {
    console.error("Required parameters are missing or invalid");

    process.exit(1);
}

console.log(`Package: ${params.package}`);
console.log(`Build directory: ${params.build_dir}`);
console.log(`Package staging directory: ${params.package_staging_dir}`);
console.log(`AUR package list path: ${params.aur_package_list_path}`);



const publishBuildPackages = async () => {
    console.log("[Builder] Copying new packages to package staging");
    execSync(`cp ${params.build_dir}/**/*.pkg.tar.zst ${params.package_staging_dir}/`);
}

const buildPackage = async (packageName: string) => {
    console.log(`[Builder] Processing "${packageName}"`);

    await PackageHelper.packageDependencyHandler(
        params,
        packageName
    );

    console.log(`[Builder] Done processing "${packageName}"`);

    await publishBuildPackages();
}

buildPackage(params.package);

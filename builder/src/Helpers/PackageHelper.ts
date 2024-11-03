import { execSync } from "child_process";
import fs from "fs";
import MakepkgHelper from "./MakepkgHelper";
import Parameters from "../Types/Parameters";
import PackageTypeHelper from "./PackageTypeHelper";
import AurRpcApiPackage from "../Types/AurRpcApiPackage";

export default class PackageHelper {
    private static validPackageNameRegex = new RegExp(/^[a-z0-9\-_]+$/);
    private static packageNotFoundRegex = new RegExp(/^error\: package \'.+\' was not found/);
    private static findPackagesOutputRegex = new RegExp(/^\/[a-z0-9-_\/\.]+\.pkg\.tar\.zst$/gm);

    public static isValidPackageName(packageName: string): boolean {
        return PackageHelper.validPackageNameRegex.test(packageName);
    }

    public static isSystemPackage(packageName: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            if (! PackageHelper.isValidPackageName(packageName)) {
                console.warn(`[builder] System package "${packageName}" has an invalid name`);

                return resolve(false);
            }

            try {
                execSync(`pacman -Si ${packageName}`);

                return resolve(true);
            } catch (error: any) {
                const errorStatus = error.status;
                const errorOutput = error?.stderr?.toString();

                // Check if the error is it telling us the package doesn't exist
                if (errorStatus === 1 && PackageHelper.packageNotFoundRegex.test(errorOutput)) {
                    console.warn(`[builder] System package ${packageName} doesn't exist`);
                    return resolve(false);
                }

                reject(error);
            }
        });
    }

    public static isAurPackage(params: Parameters, packageName: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            if (! PackageHelper.isValidPackageName(packageName)) {
                console.warn(`[builder] AUR package "${packageName}" has an invalid name`);

                return resolve(false);
            }

            const jsonRaw = fs.readFileSync(params.aur_package_list_path, 'utf8');
            const jsonParsed: Array<AurRpcApiPackage> = JSON.parse(jsonRaw);

            const foundPackage = !! jsonParsed.find((packageItem) => packageItem.Name === packageName);

            resolve(foundPackage);

            return;
        });
    }

    public static getPackagesInDirectory(directoryPath: string): Array<string> {
        const consoleOutput = execSync(`cd "${directoryPath}"; find "$(pwd)" -name "*.pkg.tar.zst"`)
        const matches       = consoleOutput.toString().matchAll(PackageHelper.findPackagesOutputRegex);

        const packages: Array<string> = [];

        for (const match of matches) {
            packages.push(match[0]);
        }

        return packages;
    }

    public static buildAurPackage(params: Parameters, packageName: string): Promise<Array<string>> {
        return new Promise(async (resolve, reject) => {
            const fullPackagePath = `${params.build_dir}/${packageName}`;

            console.log(`[builder] Building AUR package: Package: ${packageName}, Path: ${params.build_dir}`);

            // Clone the package if it doesn't exist yet
            if (! fs.existsSync(fullPackagePath)) {
                console.log(`[builder] AUR package ${packageName} directory doesn't seem to exist yet`);

                // Make sure it's a valid AUR package
                if (! await PackageHelper.isAurPackage(params, packageName)) {
                    console.error(`[builder] isAurPackage reports ${packageName} to not be an existing AUR package!`);

                    return reject("Invalid AUR package");
                }

                console.log(`[builder] Cloning AUR package ${packageName}`);

                execSync(`cd "${params.build_dir}"; git clone https://aur.archlinux.org/${packageName}.git`);
            }


            const pkgbuildPath = `${fullPackagePath}/PKGBUILD`;
            const pkgbuildData = await MakepkgHelper.parsePkgbuildFile(pkgbuildPath);

            const dependsPackages      = MakepkgHelper.getDependsFromPkgbuildData(pkgbuildData);
            const makeDependsPackages  = MakepkgHelper.getMakeDependsFromPkgbuildData(pkgbuildData);
            const checkDependsPackages = MakepkgHelper.getCheckDependsFromPkgbuildData(pkgbuildData);

            console.log(`[builder] Installing make dependencies for ${packageName}`);
            await Promise.all(
                makeDependsPackages.map((dependencyPackageName: string) => 
                    PackageHelper.installPackage(params, dependencyPackageName)
                )
            );
            console.log(`[builder] Done installing make dependencies for ${packageName}`);

            console.log(`[builder] Installing check dependencies for ${packageName}`);
            await Promise.all(
                checkDependsPackages.map((dependencyPackageName: string) => 
                    PackageHelper.installPackage(params, dependencyPackageName)
                )
            );
            console.log(`[builder] Done installing check dependencies for ${packageName}`);

            console.log(`[builder] Installing dependencies for ${packageName}`);
            await Promise.all(
                dependsPackages.map((dependencyPackageName: string) => 
                    PackageHelper.installPackage(params, dependencyPackageName)
                )
            );
            console.log(`[builder] Done installing dependencies for ${packageName}`);


            console.log(`[builder] Starting build process for ${packageName}`);
            execSync(`cd "${fullPackagePath}"; makepkg --clean --force --nodeps`);

            resolve(PackageHelper.getPackagesInDirectory(fullPackagePath));
        });
    }

    public static installSystemPackage(packageName: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log(`[builder] Installing package "${packageName}"`);

            try {
                execSync(`sudo pacman -S --noconfirm "${packageName}"`);
            } catch (e) {
                console.log(e);
                reject(e);

                return;
            }

            resolve();
        });
    }

    public static installAurPackage(aurPackagePath: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            console.log(`[builder] Installing AUR package "${aurPackagePath}"`);

            try {
                execSync(`sudo pacman -U --noconfirm "${aurPackagePath}"`);
            } catch (e) {
                reject(e);

                return;
            }

            resolve();
        });
    }

    public static installPackage(params: Parameters, packageName: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const packageConfiguration = params.package_configuration;
            let realPackageName = packageName;


            if (packageConfiguration.resolveDependenciesAs && packageName in packageConfiguration.resolveDependenciesAs) {
                realPackageName = packageConfiguration.resolveDependenciesAs[packageName];

                console.warn(`[builder] Package "${packageName}" has been mapped to "${realPackageName}" in the packagelist, using the configured package instead`);
            }


            const packageType = await PackageTypeHelper.getPackageTypeByName(params, realPackageName);

            if (! packageType) {
                reject(`[builder] The package "${realPackageName}" doesn't seem to exist`);

                return;
            }

            if (packageType.type === 'system') {
                console.log(`[builder] Installing system package "${packageType.packageToInstall}"`);

                await PackageHelper.installSystemPackage(packageType.packageToInstall);

                resolve();
                return;
            }

            if (packageType.type === 'aur') {
                console.log(`[builder] Building and installing AUR package "${packageType.packageToInstall}"`);

                const packagePaths = await PackageHelper.buildAurPackage(params, packageType.packageToInstall);
    
                for (const packagePath of packagePaths) {
                    await PackageHelper.installAurPackage(packagePath);
                }

                resolve();
                return;
            }

            reject(`[builder] We received "${packageType.type}" as the package type for "${realPackageName}", but that type is not supported.`);

            return;
        });
    }
}

import { execSync } from "child_process";
import { existsSync } from "fs";
import MakepkgHelper from "./MakepkgHelper";

export default class PackageHelper {
    private static validPackageNameRegex = new RegExp(/^[a-z0-9\-_]+$/);
    private static packageNotFoundRegex = new RegExp(/^error\: package \'.+\' was not found/);

    public static isValidPackageName(packageName: string): boolean {
        return PackageHelper.validPackageNameRegex.test(packageName);
    }

    public static isSystemPackage(packageName: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            if (! PackageHelper.isValidPackageName(packageName)) {
                console.warn(`[IsSystemPackage] Package ${packageName} is an invalid name`);

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
                    console.warn(`[IsSystemPackage] Package ${packageName} doesn't exist`);
                    return resolve(false);
                }

                reject(error);
            }
        });
    }

    public static isAurPackage(packageName: string): Promise<boolean> {
        // TODO: Figure out why this function randomly errors out without any hints as to what happened
        console.warn("WARNING: Unstable isAurPackage function is called")

        return new Promise(async (resolve, reject) => {
            if (! PackageHelper.isValidPackageName(packageName)) {
                return resolve(false);
            }

            const response = await fetch(`https://aur.archlinux.org/packages/${packageName}`);

            if (response.status === 200) {
                return resolve(true);
            }
    
            if (response.status === 404) {
                return resolve(false);
            }
    
            reject(`aur.archlinux.org returned unexpected result, error ${response.status}`);
        });
    }

    public static buildAurPackage(packageBuildPath: string, packageName: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const fullPackagePath = `${packageBuildPath}/${packageName}`;

            console.log(`[buildAurPackage] Path: ${packageBuildPath}, Package: ${packageName}`);

            // Clone the package if it doesn't exist yet
            if (! existsSync(fullPackagePath)) {
                console.log(`[buildAurPackage] AUR package ${packageName} directory doesn't seem to exist yet`);

                // Make sure it's a valid AUR package
                if (false && ! await PackageHelper.isAurPackage(packageName)) {
                    console.error(`[buildAurPackage] isAurPackage reports ${packageName} to not be an existing AUR package!`);

                    return reject("Invalid AUR package");
                }

                console.log(`[buildAurPackage] Cloning AUR package ${packageName}`);

                execSync(`cd "${packageBuildPath}"; git clone https://aur.archlinux.org/${packageName}.git`);
            }

            console.log(`[buildAurPackage] Updating AUR package ${packageName}`);

            // Update the AUR package
            execSync(`cd "${fullPackagePath}"; git pull`);

            const pkgbuildPath = `${fullPackagePath}/PKGBUILD`;
            const pkgbuildData = await MakepkgHelper.parsePkgbuildFile(pkgbuildPath);

            const dependsPackages      = MakepkgHelper.getDependsFromPkgbuildData(pkgbuildData);
            const makeDependsPackages  = MakepkgHelper.getMakeDependsFromPkgbuildData(pkgbuildData);
            const checkDependsPackages = MakepkgHelper.getCheckDependsFromPkgbuildData(pkgbuildData);

            await Promise.all(
                makeDependsPackages.map((dependencyPackageName: string) => 
                    PackageHelper.packageDependencyHandler(packageBuildPath, dependencyPackageName)
                )
            );

            await Promise.all(
                checkDependsPackages.map((dependencyPackageName: string) => 
                    PackageHelper.packageDependencyHandler(packageBuildPath, dependencyPackageName)
                )
            );

            await Promise.all(
                dependsPackages.map((dependencyPackageName: string) => 
                    PackageHelper.packageDependencyHandler(packageBuildPath, dependencyPackageName)
                )
            );

            execSync(`cd "${fullPackagePath}"; makepkg --clean --force --nodeps`);

            const compiledPackageFilename = MakepkgHelper.getEstimatedOutputFilenameFromPkgbuildData(pkgbuildData);
            const compiledPackageFilePath = `${fullPackagePath}/${compiledPackageFilename}`

            // Double check that the file exist, as the name is "guessed"
            if (! existsSync(compiledPackageFilePath)) {
                return reject(`Build package file "${compiledPackageFilePath}" doesn't seem to exist`);
            }

            resolve(compiledPackageFilePath);
        });
    }

    public static installPackage(packageName: string): Promise<void> {
        console.log(`Installing package "${packageName}"`);

        execSync(`sudo pacman -S --noconfirm "${packageName}"`);

        return Promise.resolve();
    }

    public static installAurPackage(aurPackagePath: string): Promise<void> {
        console.log(`Installing AUR package "${aurPackagePath}"`);

        execSync(`sudo pacman -U --noconfirm "${aurPackagePath}"`);

        return Promise.resolve();
    }

    // TODO: Give this function a better name
    public static packageDependencyHandler(packageBuildPath: string, packageName: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const isSystemPackage = await PackageHelper.isSystemPackage(packageName);

            if (isSystemPackage) {

                console.log(`[PackageDependencyHandler] Installing system package "${packageName}"`);
                
                await PackageHelper.installPackage(packageName);

                return resolve();
            }

            // const isAurPackage = await PackageHelper.isAurPackage(packageName);

            // if (! isAurPackage) {
            //     // Seems like this package doesn't exist, as it also isn't in the AUR

            //     return reject();
            // }


            console.log(`[PackageDependencyHandler] Building and installing AUR package "${packageName}"`);

            const packagePath = await PackageHelper.buildAurPackage(packageBuildPath, packageName);

            await PackageHelper.installAurPackage(packagePath);

            return resolve();
        });
    }
}

import { execSync } from "child_process";
import { existsSync } from "fs";
import MakepkgHelper from "./MakepkgHelper";
import AurRpcApiInfoResponse from "../Types/AurRpcApiInfoResponse";
import PackageTypeHelper from "./PackageTypeHelper";

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
        return new Promise(async (resolve, reject) => {
            if (! PackageHelper.isValidPackageName(packageName)) {
                console.warn(`[isAurPackage] Package ${packageName} is an invalid name`);

                return resolve(false);
            }

            const urlParams: Record<string, any> = new URLSearchParams();

            urlParams.append('arg', packageName);

            const response = await fetch(`https://aur.archlinux.org/rpc/v5/info?${urlParams.toString()}`);
            const responseJson: AurRpcApiInfoResponse = await response.json();

            if (response.status === 200) {
                if (responseJson.type === "error") {
                    reject(`AUR RPC API returned an unexpected result, error "${responseJson.error}"`);

                    return;
                }

                if (responseJson.resultcount > 1) {
                    reject(`AUR RPC API returned an ambiguous package when searching for "${packageName}"`);

                    return;
                }

                if (responseJson.resultcount === 1) {
                    return resolve(true);
                }

                return resolve(false);
            }

            return reject(`AUR RPC API returned an unexpected result, error "${response.status}", json: ${JSON.stringify(responseJson)}`);
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
                if (! await PackageHelper.isAurPackage(packageName)) {
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
        return new Promise(async (resolve, reject) => {
            console.log(`Installing package "${packageName}"`);

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
            console.log(`Installing AUR package "${aurPackagePath}"`);

            try {
                execSync(`sudo pacman -U --noconfirm "${aurPackagePath}"`);
            } catch (e) {
                reject(e);

                return;
            }

            resolve();
        });
    }

    // TODO: Give this function a better name
    public static packageDependencyHandler(packageBuildPath: string, packageName: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const packageType = await PackageTypeHelper.getPackageTypeByName(packageName);

            if (! packageType) {
                reject(`[PackageDependencyHandler] The package "${packageName}" doesn't seem to exist`);

                return;
            }

            if (packageType.type === 'system') {
                console.log(`[PackageDependencyHandler] Installing system package "${packageType.packageToInstall}"`);

                await PackageHelper.installPackage(packageType.packageToInstall);

                resolve();
                return;
            }

            if (packageType.type === 'aur') {
                console.log(`[PackageDependencyHandler] Building and installing AUR package "${packageType.packageToInstall}"`);

                const packagePath = await PackageHelper.buildAurPackage(packageBuildPath, packageType.packageToInstall);
    
                await PackageHelper.installAurPackage(packagePath);

                resolve();
                return;
            }

            reject(`[PackageDependencyHandler] We received "${packageType.type}" as the package type for "${packageName}", but that type is not supported.`);

            return;
        });
    }
}

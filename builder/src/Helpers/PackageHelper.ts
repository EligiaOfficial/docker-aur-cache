import { execSync } from "child_process";

export default class PackageHelper {
    private static validPackageNameRegex = new RegExp(/^[a-z0-9\-_]+$/);
    private static packageNotFoundRegex = new RegExp(/^error\: package \'.+\' was not found/);

    public static isValidPackageName(packageName: string): boolean {
        return PackageHelper.validPackageNameRegex.test(packageName);
    }

    public static isSystemPackage(packageName: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            if (! PackageHelper.isValidPackageName(packageName)) {
                resolve(false);
            }

            try {
                execSync(`pacman -Si ${packageName}`);

                resolve(true);
            } catch (error: any) {
                const errorStatus = error.status;
                const errorOutput = error?.stderr?.toString();

                // Check if the error is it telling us the package doesn't exist
                if (errorStatus === 1 && PackageHelper.packageNotFoundRegex.test(errorOutput)) {
                    resolve(false);

                    return;
                }

                reject(error);
            }
        });
    }

    public static isAurPackage(packageName: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            if (! PackageHelper.isValidPackageName(packageName)) {
                resolve(false);
            }

            const response = await fetch(`https://aur.archlinux.org/packages/${packageName}`);

            if (response.status === 200) {
                resolve(true);
            }

            if (response.status === 404) {
                resolve(false);
            }

            reject(`aur.archlinux.org returned unexpected result, error ${response.status}`);
        });
    }

    public static buildAurPackage(packageBuildPath: string, packageName: string): Promise<void> {
        // TODO: Check if the repository has already been cloned, and if so, git pull instead or cloning
        // TODO: Before attempting the clone, check it's it really is an AUR package
        // TODO: Recursively compile and install build dependencies
        // TODO: Recursively compile other AUR dependencies

        return Promise.resolve();
    }

    public static installPackage(packageName: string): Promise<void> {
        // TODO: Implement this
        return Promise.resolve();
    }

    public static installAurPackage(aurPackagePath: string): Promise<void> {
        // TODO: Implement this
        return Promise.resolve();
    }
}

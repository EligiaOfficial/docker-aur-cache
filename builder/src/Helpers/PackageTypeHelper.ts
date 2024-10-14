import { execSync } from "child_process";
import PackageType from "../Types/PackageType";
import PackageHelper from "./PackageHelper";
import PackageApiSearchApiResponse from "../Types/PackageApiSearchApiReponse";
import PackageApiPackage from "../Types/PackageApiPackage";

export default class PackageTypeHelper {
    private static pacmanPackageProvideSearchPackageNameRegex = new RegExp(/^[a-z]+\/([0-9a-z\-\_]+) .+$/m);

    public static getPackageTypeByName(packageName: string): Promise<PackageType | null> {
        return new Promise(async (resolve) => {

            const systemResult = await PackageTypeHelper.checkSystemPackageViaPacman(packageName);
            if (systemResult) {
                resolve(systemResult);

                return;
            }

            const aurResult = await PackageTypeHelper.checkAURPackage(packageName);
            if (aurResult) {
                resolve(aurResult);

                return;
            }

            const providesResultPacman = await PackageTypeHelper.checkPackageProvidesViaPacman(packageName);
            if (providesResultPacman) {
                if (providesResultPacman.packageToInstall !== packageName) {
                    console.warn(`[PackageTypeHelper] Package "${packageName}" is provided by another package according to Pacman, determined "${providesResultPacman.packageToInstall}" to be the best match`);
                }

                resolve(providesResultPacman);

                return;
            }

            const providesResultApi = await PackageTypeHelper.checkPackageProvidesViaApi(packageName);
            if (providesResultApi) {
                if (providesResultApi.packageToInstall !== packageName) {
                    console.warn(`[PackageTypeHelper] Package "${packageName}" is provided by another package according to the API, determined "${providesResultApi.packageToInstall}" to be the best match`);
                }

                resolve(providesResultApi);

                return;
            }

            resolve(null);

            return;
        });
    }

    private static async checkSystemPackageViaPacman(packageName: string): Promise<PackageType | null> {
        const result = await PackageHelper.isSystemPackage(packageName);

        if (result) {
            return {
                type: 'system',
                packageToInstall: packageName
            };
        }

        return null;
    }

    private static async checkAURPackage(packageName: string): Promise<PackageType | null> {
        const result = await PackageHelper.isAurPackage(packageName);

        if (result) {
            return {
                type: 'aur',
                packageToInstall: packageName
            };
        }

        return null;
    }

    private static async checkPackageProvidesViaPacman(binaryName: string): Promise<PackageType | null> {
        try {
            const consoleOutput = execSync(`sudo pacman -Fy "${binaryName}"`);
            const foundPackage = consoleOutput.toString().match(PackageTypeHelper.pacmanPackageProvideSearchPackageNameRegex);

            if (! foundPackage) {
                return null;
            }

            return {
                type: 'system',
                packageToInstall: foundPackage[1]
            };
        } catch (e) {
            console.error(`Unable to search for the binary file "${binaryName}"`);

            return null;
        }

        return null;
    }

    private static async checkPackageProvidesViaApi(binaryName: string): Promise<PackageType | null> {
        const urlParams: Record<string, any> = new URLSearchParams();

        urlParams.append('q', binaryName);

        const response = await fetch(`https://archlinux.org/packages/search/json/?${urlParams.toString()}`);
        const responseJson: PackageApiSearchApiResponse = await response.json();

        if (response.status === 200) {
            const foundPackage = responseJson.results.find((packageInfo: PackageApiPackage) => {
                return packageInfo.provides.filter((provide: string) => provide === binaryName);
            });

            if (foundPackage) {
                return {
                    type: 'system',
                    packageToInstall: foundPackage.pkgname
                };
            }
        }

        return null;
    }
}
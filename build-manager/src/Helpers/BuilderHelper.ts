import { MountConfig } from 'dockerode';

export default class BuilderHelper {
    public static getBuilderStartCommand(aurPackageListPath: string, packageName: string): string {
        return `cd /builder; node ./dist/builder.js --package="${packageName}" --build_dir="/repository-builder" --package_staging_dir="/package-staging" --aur_package_list_path="${aurPackageListPath}"`;
    }

    public static getBuilderMounts(aurPackageListPath: string): MountConfig {
        return [
            {
                Target: '/package-staging',
                Source: 'docker-aur-cache_package-staging',
                Type: 'volume',
                ReadOnly: false,
            },
            {
                Target: aurPackageListPath,
                Source: aurPackageListPath,
                Type: 'bind',
                ReadOnly: true,
            }
        ];
    } 
}

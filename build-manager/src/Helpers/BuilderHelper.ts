import { MountConfig } from 'dockerode';

export default class BuilderHelper {
    public static getBuilderStartCommand(directory: string): string {
        return `cd /builder; node ./dist/builder.js --package="${directory}" --build_dir="/repository-builder" --package_staging_dir="/package-staging"`;
    }

    public static getBuilderMounts(): MountConfig {
        return [
            {
                Target: '/package-staging',
                Source: 'docker-aur-cache_package-staging',
                Type: 'volume',
                ReadOnly: false,
            }
        ];
    } 
}

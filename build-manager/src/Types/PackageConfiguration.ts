export default interface PackageConfiguration {
    packageName: string,
    runCommandsBeforeBuild?: Array<string>,
    resolveDependenciesAs?: {[key: string]: string};
};

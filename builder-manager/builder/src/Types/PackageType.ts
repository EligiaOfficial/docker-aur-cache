export default interface PackageType {
    type: 'system'|'aur',
    packageToInstall: string,
};

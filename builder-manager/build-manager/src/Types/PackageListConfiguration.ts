import BuilderLimit from "./BuilderLimit";
import PackageConfiguration from "./PackageConfiguration";

export default interface PackageListConfiguration {
    builderLimit: BuilderLimit,
    packages: Array<PackageConfiguration>
};

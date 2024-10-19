import PackageConfiguration from "./PackageConfiguration";
import PackageBuildReportLogLine from "./PackageBuildReportLogLine";

export default interface PackageBuildReport {
    configuration: PackageConfiguration,
    success: boolean,
    buildStartTime: Date,
    buildEndTime: Date,
    logs: Array<PackageBuildReportLogLine>,
};

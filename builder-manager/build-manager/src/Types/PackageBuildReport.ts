import ContainerStatsLine from "./ContainerStatsLine";
import PackageConfiguration from "./PackageConfiguration";
import PackageBuildReportLogLine from "./PackageBuildReportLogLine";

export default interface PackageBuildReport {
    configuration: PackageConfiguration,
    success: boolean,
    buildStartTime: Date,
    buildEndTime: Date,
    containerStats: Array<ContainerStatsLine>,
    logs: Array<PackageBuildReportLogLine>,
};

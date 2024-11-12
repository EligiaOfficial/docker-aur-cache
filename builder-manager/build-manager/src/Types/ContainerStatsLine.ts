export default interface ContainerStatsLine {
    sampleTakenAt: number,
    cpuUsagePercent: number,
    memoryUsageMB: number,
    memoryUsagePercent: number,
}

export default class TimeHelper {
    public static getFormattedTimeDifference(startTime: Date, endTime: Date): string {
        const timeDiff = endTime.getTime() - startTime.getTime();
        const formattedTime = timeDiff / 1000;

        return `${formattedTime}s`;
    }
}

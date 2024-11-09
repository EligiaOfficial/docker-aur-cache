
export default class TimeHelper {
    public static getFormattedTimeDifference(startTime: Date, endTime: Date): string {
        const timeDiff = endTime.getTime() - startTime.getTime();
        const formattedTime = timeDiff / 1000;

        return `${formattedTime}s`;
    }

    public static getFormattedDateTimeForFilename(dateToFormat: Date): string {
        const year = dateToFormat.getFullYear();
        const month = String(dateToFormat.getMonth() + 1).padStart(2, '0');
        const day = String(dateToFormat.getDate()).padStart(2, '0');
        const hours = String(dateToFormat.getHours()).padStart(2, '0');
        const minutes = String(dateToFormat.getMinutes()).padStart(2, '0');
        const seconds = String(dateToFormat.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
    }

    public static stringifiedTimeDurationToSeconds(stringifiedTimeDuration: string): number {
        const unit = stringifiedTimeDuration.slice(-1).toLowerCase();
        const value = parseFloat(stringifiedTimeDuration.slice(0, -1));

        if (isNaN(value)) {
          throw new Error('Invalid time value');
        }

        switch (unit) {
            case 's': // seconds
                return value;
            case 'm': // minutes
                return value * 60;
            case 'h': // hours
                return value * 60 * 60;
            default:
                throw new Error('Invalid time unit');
        }
    }
}

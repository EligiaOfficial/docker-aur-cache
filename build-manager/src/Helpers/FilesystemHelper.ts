import { execSync } from "child_process";

export default class FilesystemHelper {
    public static getFilesInDirectoryByFileExtension(directory: string, fileExtension: string): Array<string> {
        const commandOutput = execSync(`find ${directory} -maxdepth 1 -type f -name "*.${fileExtension}"`).toString();
        const files = commandOutput.split('\n');

        // Removes the last element, which is just an empty string
        files.pop();

        return files;
    }

    public static getFileCountInDirectoryByFileExtension(directory: string, fileExtension: string): number {
        return FilesystemHelper.getFilesInDirectoryByFileExtension(directory, fileExtension).length;
    }

    public static ensureDirectoryExists(directory: string): void {
        execSync(`mkdir -p "${directory}"`);
    }

    public static stringifiedSizeToBytes(stringifiedSize: string): number {
        const unit = stringifiedSize.slice(-1).toLowerCase();
        const value = parseFloat(stringifiedSize.slice(0, -1));

        if (isNaN(value)) {
          throw new Error('Invalid memory limit value');
        }

        switch (unit) {
            case 'b': // bytes
                return value;
            case 'k': // kilobytes
                return value * 1024;
            case 'm': // megabytes
                return value * 1024 ** 2;
            case 'g': // gigabytes
                return value * 1024 ** 3;
            default:
                throw new Error('Invalid memory unit');
        }
    }
}

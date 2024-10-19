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
}

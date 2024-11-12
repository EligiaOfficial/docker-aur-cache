import fs from 'fs';

export default class DockerHelper {
    public static getAllFilesInDirectoryWithoutDockerignore(directory: string): Array<string> {
        const allFiles = <Array<string>>fs.readdirSync(directory, { recursive: true });
        const ignoredFiles = fs.readFileSync(`${directory}/.dockerignore`, 'utf8').split(/\r?\n/);

        return allFiles.filter((file) => ! ignoredFiles.includes(file));
    }
}

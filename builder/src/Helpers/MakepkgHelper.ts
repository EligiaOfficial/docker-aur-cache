import { execSync } from "child_process";

export default class MakepkgHelper {
    private static makepkgPrintSrcRegex = new RegExp(/^\s*([a-z0-9]+)\ \=\ (.+)$/gm);

    public static parsePkgbuildFile(pkgbuildFilePath: string): Promise<object> {
        return new Promise(async (resolve) => {
            const consoleOutput = execSync(`cd $(dirname $(readlink -f "${pkgbuildFilePath}")); makepkg --printsrcinfo`);
            const matches       = consoleOutput.toString().matchAll(MakepkgHelper.makepkgPrintSrcRegex);

            const parsedData: Record<string, any> = {};

            for (const match of matches) {
                const key = match[1];
                const value = match[2];

                // Does the key already exist and is it not an array yet?
                // If so, wrap it into an array
                if (key in parsedData && ! (parsedData[key] instanceof Array)) {
                    parsedData[key] = [parsedData[key]];
                }

                // Does the key already exist and is it already an array?
                // If so, push the item
                if (key in parsedData && parsedData[key] instanceof Array) {
                    parsedData[key].push(value);

                    continue;
                }

                // It's a "regular" item, simply push it
                parsedData[key] = value;
            }

            resolve(parsedData);
        });
    }
}

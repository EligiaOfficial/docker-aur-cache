import fs from "fs";
import IValidator from "./IValidator";

export default class IsDirectoryValidator implements IValidator {
    public validate(value: any): boolean {
        if (typeof value === "undefined") {
            // This field could be optional, so assume it's fine

            return true;
        }

        if (typeof value !== "string") {
            return false;
        }

        if (! fs.existsSync(value)) {
            return false;
        }

        return fs.lstatSync(value).isDirectory();
    };

    public validationFailedMessage(value: any): string {
        return `The given path "${value}" doesn't exist or is not a directory`;
    }
}

import fs from "fs";
import IValidator from "./IValidator";

export default class IsFileValidator implements IValidator {
    public validate(value: any): boolean {
        if (typeof value !== "string") {
            return false;
        }

        if (! fs.existsSync(value)) {
            return false;
        }

        return fs.lstatSync(value).isFile();
    };

    public validationFailedMessage(value: any): string {
        return `The given path "${value}" doesn't exist or is not a file`;
    }
}

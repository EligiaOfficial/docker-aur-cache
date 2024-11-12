import IValidator from "./IValidator";

export default class RegexValidator implements IValidator {
    private validationRegex: RegExp = new RegExp(".+");

    constructor(validationRegex: RegExp) {
        this.validationRegex = validationRegex;
    }

    public validate(value: any): boolean {
        if (typeof value === "undefined") {
            // This field could be optional, so assume it's fine

            return true;
        }

        if (typeof value !== "string") {
            // We can only test strings

            return false;
        }

        return this.validationRegex.test(value);
    };

    public validationFailedMessage(value: any): string {
        return `The value "${value}" does not match the expected regex format "${this.validationRegex.source}"`;
    }
}

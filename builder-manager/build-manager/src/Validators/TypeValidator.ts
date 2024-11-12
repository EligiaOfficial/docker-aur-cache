import IValidator from "./IValidator";

export default class TypeValidator implements IValidator {
    private expectedType: string = "";

    constructor(expectedType: "string" | "number" | "bigint" | "boolean" | "undefined" | "null" | "symbol" | "object") {
        this.expectedType = expectedType;
    }

    public validate(value: any): boolean {
        if (typeof value === "undefined") {
            // This field could be optional, so assume it's fine

            return true;
        }

        return typeof value === this.expectedType;
    };

    public validationFailedMessage(value: any): string {
        const actualType = typeof value;

        return `Expected type "${this.expectedType}", but received "${actualType}"`;
    }
}

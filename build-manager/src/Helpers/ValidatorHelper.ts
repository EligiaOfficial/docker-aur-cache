import IValidator from "../Validators/IValidator";

export default class ValidatorHelper {
    public static validateObject(validators: {[key: string]: Array<IValidator>}, objectToValidate: {[key: string]: any}): {[key: string]: string} {
        const validationErrors: {[key: string]: string} = {};

        Object.keys(validators).forEach((keyToValidate: string) => {
            const validationRules = validators[keyToValidate];
            const valueToValidate = objectToValidate[keyToValidate];

            for (const validationRule of validationRules) {
                if (validationRule.validate(valueToValidate)) {
                    // All good, go to the next validation rule

                    continue;
                }

                // It fails the validation, log and continue to the next key
                validationErrors[keyToValidate] = validationRule.validationFailedMessage(valueToValidate);

                break;
            }
        });

        return validationErrors;
    }

    public static stringifyValidationMessages(validationMessages: {[key: string]: string}): string {
        const keys = Object.keys(validationMessages);
        let outputString = "";

        keys.forEach((validationKey: string) => {
            const validationMessage = validationMessages[validationKey];

            outputString += ` - ${validationKey}: ${validationMessage}\n`;
        });

        return outputString;
    }
}

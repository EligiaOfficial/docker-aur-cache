import IValidator from "../Validators/IValidator";

export default class ValidatorHelper {
    public static validateObject(validators: {[key: string]: Array<IValidator>}, objectToValidate: {[key: string]: any}|undefined): {[key: string]: string} {
        const validationErrors: {[key: string]: string} = {};

        // TODO: See if there is a better alternative, as now values that are null while they have a RequiredValidator() set, still pass the check
        if (! objectToValidate) {
            // It could be undefined in case we are checking deeper in an optional object that isn't set

            return {};
        }

        Object.keys(validators).forEach((keyToValidate: string) => {
            const splitKey = keyToValidate.split('.');
            const firstElementSplitKey = splitKey[0];
            const secondElementSplitKey: string|undefined = splitKey[1];

            // Are we currently going to check an array?
            if (firstElementSplitKey === "*") {
                // Is this checking a key inside an array?
                if (secondElementSplitKey) {
                    Object.keys(objectToValidate).forEach((index: number|string) => {
                        const arrayItemValidateValidators: {[key: string]: Array<IValidator>} = {};
                        const joinedKey = splitKey.slice(1).join('.');
        
                        arrayItemValidateValidators[joinedKey] = validators[keyToValidate];

                        const arrayItemValidationErrors = ValidatorHelper.validateObject(
                            arrayItemValidateValidators,
                            objectToValidate[index]
                        );

                        // TODO: Fix issue with nested arrays that causes it to show a wildcard instead of the index (*.runCommandsBeforeBuild.*)
                        Object.keys(arrayItemValidationErrors).forEach((arrayItemValidationErrorKey: string) => {
                            validationErrors[`[${index}].${joinedKey}`] = arrayItemValidationErrors[arrayItemValidationErrorKey];
                        });
                    });

                    return;
                }

                // We are just checking each element
                Object.keys(objectToValidate).forEach((index: number|string) => {
                    const value = objectToValidate[index];
                    const validationRules = validators[keyToValidate];

                    // Wrap each item in a simple object and then pass that to itself for checking
                    const arrayItemValidationErrors = ValidatorHelper.validateObject(
                        {root: validationRules},
                        {root: value}
                    );

                    Object.keys(arrayItemValidationErrors).forEach((arrayItemValidationErrorKey: string) => {
                        validationErrors[`[${index}]`] = arrayItemValidationErrors[arrayItemValidationErrorKey];
                    });
                });

                return;
            }

            // Is this key still going deeper?
            if (splitKey.length > 1) {
                const recursiveObjectToValidateKey = splitKey.shift()!;
                const recursiveValidateValidators: {[key: string]: Array<IValidator>} = {};

                recursiveValidateValidators[splitKey.join('.')] = validators[keyToValidate];

                const recursiveValidationErrors = ValidatorHelper.validateObject(
                    recursiveValidateValidators,
                    objectToValidate[recursiveObjectToValidateKey]
                );

                Object.keys(recursiveValidationErrors).forEach((recursiveValidationErrorKey: string) => {
                    validationErrors[`${recursiveObjectToValidateKey}.${recursiveValidationErrorKey}`] = recursiveValidationErrors[recursiveValidationErrorKey];
                });

                return;
            }

            // We now have a "regular" key that we can test
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

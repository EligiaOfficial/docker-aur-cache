export default interface IValidator {
    validate(value: any): boolean;
    validationFailedMessage(value: any): string;
};

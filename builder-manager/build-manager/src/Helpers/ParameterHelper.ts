import type Parameters from "../Types/Parameters";
import IsDirectoryValidator from "../Validators/IsDirectoryValidator";
import IsFileValidator from "../Validators/IsFileValidator";
import IValidator from "../Validators/IValidator";
import RequiredValidator from "../Validators/RequiredValidator";
import TypeValidator from "../Validators/TypeValidator";

export default class ParameterHelper {
    public static getParameters(): Parameters {
        return require('minimist')(process.argv.slice(2));
    }

    public static getParameterValidationRules(): {[key: string]: Array<IValidator>} {
        return {
            builder_image_name: [
                new RequiredValidator(),
                new TypeValidator("string")
            ],
            packagelist_configuration_path: [
                new RequiredValidator(),
                new TypeValidator("string"),
                new IsFileValidator()
            ],
            builder_dir: [
                new RequiredValidator(),
                new TypeValidator("string"),
                new IsDirectoryValidator()
            ],
            package_staging_dir: [
                new RequiredValidator(),
                new TypeValidator("string"),
                new IsDirectoryValidator()
            ],
            build_report_dir: [
                new RequiredValidator(),
                new TypeValidator("string"),
                new IsDirectoryValidator()
            ],
            repository_archive_dir: [
                new RequiredValidator(),
                new TypeValidator("string"),
                new IsDirectoryValidator()
            ],
            repository_dir: [
                new RequiredValidator(),
                new TypeValidator("string"),
                new IsDirectoryValidator()
            ],
            repository_name: [
                new RequiredValidator(),
                new TypeValidator("string")
            ],
        };
    }
}

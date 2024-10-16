import type Parameters from "../Types/Parameters";
import type RawParameters from "../Types/RawParameters";

export default class ParameterHelper {
    public static getRawParameters(): RawParameters {
        return require('minimist')(process.argv.slice(2));
    }

    public static validateRequiredParameters(params: RawParameters): boolean {
        return (
            typeof params.build_dir === "string" &&
            typeof params.package_staging_dir === "string" &&
            typeof params.aur_package_list_path === "string" &&
            typeof params.package_configuration_encoded === "string"
            // TODO: Implement better validation (path exists, packagelist is valid format etc.)
        );
    }

    public static getParametersFromRawParameters(params: RawParameters): Parameters {
        return {
            build_dir: params.build_dir,
            package_staging_dir: params.package_staging_dir,
            aur_package_list_path: params.aur_package_list_path,
            package_configuration: JSON.parse(Buffer.from(params.package_configuration_encoded, 'base64').toString('utf8')),
        }
    }
}

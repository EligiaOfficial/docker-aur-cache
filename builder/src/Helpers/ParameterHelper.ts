import type Parameters from "../Types/Parameters";

export default class ParameterHelper {
    public static getParameters(): Parameters {
        return require('minimist')(process.argv.slice(2));
    }

    public static validateRequiredParameters(params: Parameters): boolean {
        return (
            typeof params.package === "string" &&
            typeof params.build_dir === "string" &&
            typeof params.package_staging_dir === "string" &&
            typeof params.aur_package_list_path === "string"
            // TODO: Implement better validation (path exists, packagelist is valid format etc.)
        );
    }
}

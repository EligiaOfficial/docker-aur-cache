import ParameterHelper from './Helpers/ParameterHelper';

const params = ParameterHelper.getParameters();

if (! ParameterHelper.validateRequiredParameters(params)) {
    console.error("Required parameters are missing or invalid");

    process.exit(1);
}

console.log(`Packagelist path: ${params.packagelist_path}`);
console.log(`Build directory: ${params.build_dir}`);
console.log(`Repository directory: ${params.repository_dir}`);

// TODO: Read the packagelist file and loop over all the requested packages

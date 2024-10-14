import PackageApiPackage from "./PackageApiPackage";

export default interface PackageApiSearchApiResponse {
    version: number,
    limit: number,
    valid: boolean,
    results: Array<PackageApiPackage>,
    num_pages: number,
    page: number,
};

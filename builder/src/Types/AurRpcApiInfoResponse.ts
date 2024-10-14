import AurRpcApiPackage from "./AurRpcApiPackage";

export default interface AurRpcApiInfoResponse {
    error: string|undefined,
    resultcount: number,
    results: Array<AurRpcApiPackage>,
    type: "error" | "multiinfo",
    version: number,
};

import ciInfo from "ci-info";

export const ciVendor = ciInfo.isCI ? (ciInfo.name ?? "unknown") : undefined;

import {Filter} from "./filter";

export type Sponsor = {
    account: string,
    privateKey: string,
}

export type FullSponsor = {
    account: string,
    privateKey: string,
    publicKey: string
}

export type Config = {
    port: number,
    sponsors: Sponsor[],
    chainId: string,
    logLevel: "no" | "error" | "info" | "warn" | "debug",
    filter?: Filter
}

export const checkConfig = (config: any) => {
    if (config.sponsors === undefined)
        throw new Error("Config should contain array of sponsors");
    if (!Array.isArray(config.sponsors))
        throw new Error("Config: sponsors should be an array");
    config.sponsors.forEach((sponsor: any) => {
        if (typeof sponsor.account !== "string" || typeof sponsor.privateKey !== "string")
            throw new Error("Config: sponsors should be an object with account and privateKey string fields");
    });

    if (typeof config.chainId !== "string")
        throw new Error("Config should contain chainId as string");

    if (!["no", "error", "info", "warn", "debug"].includes(config.logLevel))
        throw new Error("LogLevel should be one of [no, info, warn, debug]");


    const filter = config.filter;
    if (filter === undefined)
        return;
    // TODO: add filter type check
};

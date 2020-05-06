import {Filter} from "./filter";
import Ajv from "ajv";
import * as path from "path";
import * as fs from "fs";

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

    const ajv = new Ajv();
    const validate = ajv.compile(
        JSON.parse(fs.readFileSync(path.resolve(__dirname, "../schemas/filter.json")).toString()),
    );

    const valid = validate(filter);
    if (!valid) {
        let err = "Cannot start app: filter error. Please check your filter in configuration.\n";
        err += validate.errors.map(err => JSON.stringify(err)).reduce((acc: string, cur: string) => `${acc}\n${cur}`);
        throw new Error(err);
    }
};

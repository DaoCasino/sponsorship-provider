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
    sponsors: Sponsor[],
    chainId: string,
    filter?: Filter
}

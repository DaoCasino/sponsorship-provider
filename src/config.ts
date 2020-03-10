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
    nodeUrl: string,
    sponsors: Sponsor[]
}

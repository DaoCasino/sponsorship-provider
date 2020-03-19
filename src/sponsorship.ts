import {Api, JsonRpc, Serialize} from "eosjs/dist";
import {SignatureProvider} from "eosjs/dist/eosjs-api-interfaces";
import NodeEosjsSignatureProvider from "node-eosjs-signature-provider";
import {Abi} from "eosjs/dist/eosjs-rpc-interfaces";
import {FullSponsor} from "./config";
import {filter, Filter} from "./filter";

const {TextEncoder, TextDecoder} = require('util');

const extensionAbi = {
    "version": "eosio::abi/1.0",
    "structs": [
        {
            "name": "sponsor_ext",
            "base": "",
            "fields": [
                {
                    "name": "sponsor",
                    "type": "name"
                },
            ]
        }
    ],
};

export class Sponsorship {
    private readonly signatureProvider: SignatureProvider;
    private readonly extensions: { data: string; type: number }[];
    private readonly api: Api;
    private readonly rpc: JsonRpc;
    private readonly sponsors: FullSponsor[];
    private readonly filter?: Filter;
    private readonly chainId: string;
    private nextKey = 0;

    public static async create(sponsors: FullSponsor[], filter: Filter | undefined, chainId: string) {
        const sponsorPrivateKeys = sponsors.map(sponsor => sponsor.privateKey);
        const signatureProvider = new NodeEosjsSignatureProvider(sponsorPrivateKeys);
        // The url and fetch will never be used, but need to be specified
        const rpc = new JsonRpc("");
        const api = new Api({
            rpc: rpc,
            signatureProvider: signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder()
        });

        return new Sponsorship(sponsors, rpc, api, signatureProvider, filter, chainId);
    }

    private constructor(
        sponsors: FullSponsor[],
        rpc: JsonRpc,
        api: Api,
        signatureProvider: SignatureProvider,
        filter: Filter | undefined,
        chainId: string
    ) {
        this.rpc = rpc;
        this.api = api;
        this.sponsors = sponsors;
        this.signatureProvider = signatureProvider;
        this.filter = filter;
        this.chainId = chainId;

        const sponsorType = Serialize.getTypesFromAbi(this.api.abiTypes, extensionAbi as Abi).get('sponsor_ext');
        this.extensions = sponsors.map((sponsor) => {
            const buffer = new Serialize.SerialBuffer({textEncoder: new TextEncoder(), textDecoder: new TextDecoder()});
            sponsorType.serialize(buffer, {"sponsor": sponsor.account});
            return {
                type: 0,
                data: Serialize.arrayToHex(buffer.asUint8Array())
            }
        })
    }

    private filterTransaction(transaction: any) {
        if (this.filter)
            return filter(transaction, this.filter);
        return true;
    }

    private deserializeTransaction(transaction: Uint8Array) {
        try {
            return this.api.deserializeTransaction(transaction);
        } catch (e) {
            throw new Error("Could not deserialize transaction");
        }
    }

    public async sign(serializedTransaction: number[] | Uint8Array) {
        const inputTrx = Array.isArray(serializedTransaction) ?
            Uint8Array.from(serializedTransaction) : serializedTransaction;

        const inputTrxDes = this.deserializeTransaction(inputTrx);
        if (!this.filterTransaction(inputTrxDes))
            throw new Error("Transaction was filtered");

        const extension = this.extensions[this.nextKey];
        const sponsorPubKey = this.sponsors[this.nextKey].publicKey;
        this.nextKey = (this.nextKey + 1) % this.sponsors.length;

        inputTrxDes.transaction_extensions.push(extension);
        const outputTrx = this.api.serializeTransaction(inputTrxDes);

        return this.signatureProvider.sign({
            requiredKeys: [sponsorPubKey],
            serializedTransaction: outputTrx,
            abis: [],
            chainId: this.chainId
        });
    }
}

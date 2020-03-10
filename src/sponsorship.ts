import {Api, JsonRpc, Serialize} from "eosjs/dist";
import {SignatureProvider, SignatureProviderArgs} from "eosjs/dist/eosjs-api-interfaces";
import NodeEosjsSignatureProvider from "node-eosjs-signature-provider";
import {Abi} from "eosjs/dist/eosjs-rpc-interfaces";
import {FullSponsor} from "./config";

const fetch = require('node-fetch');

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
    private readonly buffers: Serialize.SerialBuffer[];
    private readonly api: Api;
    private readonly rpc: JsonRpc;
    private readonly sponsors: FullSponsor[];
    private chainId = "";
    private nextKey = 0;

    public static async create(sponsors: FullSponsor[], nodeUrl: string) {
        const sponsorPrivateKeys = sponsors.map(sponsor => sponsor.privateKey);
        const signatureProvider = new NodeEosjsSignatureProvider(sponsorPrivateKeys);
        const rpc = new JsonRpc(nodeUrl, {fetch});
        const api = new Api({
            rpc: rpc,
            signatureProvider: signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder()
        });
        const info = await rpc.get_info();
        const chainId = info.chain_id;
        api.chainId = chainId;

        return new Sponsorship(sponsors, sponsorPrivateKeys, rpc, api, signatureProvider, chainId);
    }

    private constructor(
        sponsors: FullSponsor[],
        sponsorPrivateKeys: string[],
        rpc: JsonRpc,
        api: Api,
        signatureProvider: SignatureProvider,
        chainId: string
    ) {
        this.rpc = rpc;
        this.api = api;
        this.chainId = chainId;
        this.sponsors = sponsors;
        this.signatureProvider = signatureProvider;

        const sponsorType = Serialize.getTypesFromAbi(this.api.abiTypes, extensionAbi as Abi).get('sponsor_ext');
        this.buffers = sponsorPrivateKeys.map(key => {
            const buffer = new Serialize.SerialBuffer({textEncoder: new TextEncoder(), textDecoder: new TextDecoder()});
            sponsorType.serialize(buffer, {"sponsor": key});
            return buffer;
        })
    }

    public async sign(transaction: any) {
        const buffer = this.buffers[this.nextKey];
        const sponsor = this.sponsors[this.nextKey];

        this.nextKey++;
        if (this.nextKey == this.sponsors.length)
            this.nextKey = 0;

        const extended = {
            ...transaction,
            transaction_extensions: [{
                type: 0,
                data: Serialize.arrayToHex(buffer.asUint8Array())
            }]
        };

        const trx = await this.api.transact(extended, {...extended.tapos, broadcast: false, sign: false});

        return this.signatureProvider.sign({
            chainId: this.chainId,
            requiredKeys: [sponsor.publicKey],
            serializedTransaction: trx.serializedTransaction
        } as SignatureProviderArgs);
    }
}

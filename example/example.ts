import {Api, JsonRpc} from "eosjs/dist";
import {JsSignatureProvider} from "eosjs/dist/eosjs-jssig";
import {SignatureProviderArgs} from "eosjs/dist/eosjs-api-interfaces";
import {PushTransactionArgs} from "eosjs/dist/eosjs-rpc-interfaces";

const fetch = require('node-fetch');
const ecc = require('eosjs-ecc');

// Consider sponsorship-provider is working on localhost:3000
// and all required account are created
const fromKey = "5KUZG7WXSSRwjRZijWU3yFWtedssgVTTwaAbRm2Y8RHdDkmaYJC";
const fromPublic = ecc.privateToPublic(fromKey);

const signatureProvider = new JsSignatureProvider([
    fromKey
]);

const rpc = new JsonRpc('http://localhost:8888', {fetch});
const api = new Api({rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder()});

const act = async () => {
    // Get chainId, because signature depends on it
    const info = await rpc.get_info();
    api.chainId = info.chain_id;

    // Create serializedTransaction
    // Transact method fetches abi from the node and serializes transaction
    // Make sure it is not signed and not broadcasted
    console.log(api.chainId);
    const serializedTrx = (await api.transact(
        {
            actions: [{
                account: 'bbbbbbbtoken',
                name: 'transfer',
                authorization: [{
                    actor: 'bbbbbbbbfrom',
                    permission: 'active'
                }],
                data: {
                    from: 'bbbbbbbbfrom',
                    to: 'bbbbbbbbbbto',
                    quantity: '10.0000 SYS',
                    memo: 'memo' + Math.random()
                }
            }],
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
            broadcast: false, // Important!
            sign: false, // Important!
        })).serializedTransaction;

    // Make POST request to the sponsorship-provider service
    // Body contains serializedTransaction and chainId
    // It returns { serializedTransaction: number[], signatures: number[] }
    // So we convert serializedTransaction to UInt8Array immediately
    const resultTrx: PushTransactionArgs = await fetch("http://localhost:3000/sponsor", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            serializedTransaction: Array.from(serializedTrx),
            chainId: api.chainId
        }),
    })
        .then((res: any) => res.json())
        .then((res: any) => {
            return {
                serializedTransaction: Uint8Array.from(res.serializedTransaction),
                signatures: res.signatures
            } as PushTransactionArgs
        });

    // resultTrx.serializedTransaction differs from serializedTrx because contains abi of sponsorship extension
    // Sign it with local private key and get the signature
    const mySignature = (await signatureProvider.sign({
        chainId: api.chainId,
        requiredKeys: [fromPublic],
        abis: [],
        serializedTransaction: resultTrx.serializedTransaction
    } as SignatureProviderArgs)).signatures[0];

    // Add local signature to the sponsored transaction
    resultTrx.signatures.push(mySignature);

    // Push transaction to the blockchain
    const result = await api.pushSignedTransaction(resultTrx);

    console.log(result);
};

act();

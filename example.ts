import {Api, JsonRpc} from "eosjs/dist";
import {JsSignatureProvider} from "eosjs/dist/eosjs-jssig";
import {SignatureProviderArgs} from "eosjs/dist/eosjs-api-interfaces";

const fetch = require('node-fetch');
const ecc = require('eosjs-ecc');

// Consider sponsorship-provider is working on localhost:3000
const fromKey = "5KRREVqk9LFrCv24V88NHt4peC6ixohFQ9XuSZ8mjq9qwrsxjtt";
const fromPublic = ecc.privateToPublic(fromKey);
const trx = {
    actions: [{
        account: 'bench1qyvmtt',
        name: 'transfer',
        authorization: [{
            actor: 'benchqgmud23',
            permission: 'active'
        }],
        data: {
            from: 'benchqgmud23',
            to: 'benchmvkiuw3',
            quantity: '10.0000 SYS',
            memo: 'memo' + Math.random()
        }
    }],
    tapos: {
        blocksBehind: 3,
        expireSeconds: 30,
    }
};

const signatureProvider = new JsSignatureProvider([
    fromKey
]);
const rpc = new JsonRpc('http://localhost:8888', {fetch});
const api = new Api({rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder()});

const act = async () => {
    const info = await rpc.get_info();
    api.chainId = info.chain_id;

    const serializedTrx = await fetch("http://localhost:3000/sponsor", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(trx),
    }).then((res: any) => res.json());

    serializedTrx.serializedTransaction = Uint8Array.from(serializedTrx.serializedTransaction);

    const signed = await signatureProvider.sign({
        chainId: api.chainId,
        requiredKeys: [fromPublic],
        serializedTransaction: serializedTrx.serializedTransaction
    } as SignatureProviderArgs);

    serializedTrx.signatures = [...serializedTrx.signatures, ...signed.signatures];
    // now serializedTrx is signed transaction with sponsorship

    const result = await api.pushSignedTransaction(serializedTrx);
    console.log(result);
};

act();

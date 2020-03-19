import createApp from "../src/app";
import supertest from "supertest";
import {testData} from "./testdata";
import {Config} from "../src/config";

let request: supertest.SuperTest<supertest.Test>;

const sampleConfig: Config = {
    logLevel: "error",
    sponsors: [
        {
            account: "eosio",
            privateKey: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
        }
    ],
    chainId: "cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f"
};

const sampleRequest = async (request: supertest.SuperTest<supertest.Test>) => {
    const response = await request.post('/sponsor')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(testData[0].req));

    expect(response.status).toBe(200);
    expect(response.text).toBe(JSON.stringify(testData[0].res));
};

const sampleFilteredRequest = async (request: supertest.SuperTest<supertest.Test>) => {
    const response = await request.post('/sponsor')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(testData[0].req));

    expect(response.status).toBe(400);
    expect(response.text).toBe(JSON.stringify({error: "Transaction was filtered"}));
};

describe('Service unit tests', () => {
    // Applies only to tests in this describe block
    beforeAll(async () => {
        const app = await createApp(sampleConfig);
        request = supertest(app);
    });

    test("Get sponsors' public keys", async () => {
        const response = await request.get('/sponsors');

        expect(response.status).toBe(200);
        expect(response.text).toBe('["EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"]');
    });

    test("Sign sample transaction", async () => {
        await sampleRequest(request);
    });

    test("Invalid private key", async () => {
        try {
            const app = await createApp({
                    logLevel: "no",
                    sponsors: [
                        {
                            account: "eosio",
                            privateKey: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
                        },
                        {
                            account: "test",
                            privateKey: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD4"
                        },
                    ],
                    chainId: "cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f"
                }
            );
            expect(app).toBeNull();
        } catch (e) {
            expect(e.message).toContain("is not a valid private key")
        }
    });

    test("Invalid request body", async () => {
        const response = await request.post('/sponsor')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({meow: "", chainId: "wefwefewf"}));

        expect(response.status).toBe(400);
    });

    test("Invalid request body (serializedTransaction type)", async () => {
        const response = await request.post('/sponsor')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({serializedTransaction: 10}));
        expect(response.status).toBe(400);
    });

    test("Invalid transaction", async () => {
        const response = await request.post('/sponsor')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({serializedTransaction: [10], chainId: "lol"}));

        expect(response.status).toBe(500);
    });
});

// -----------------------------------------------------------------------------------------

describe('Filters tests', () => {
    test("oneOf filter positive", async () => {
        const app = await createApp({
                ...sampleConfig,
                filter: {
                    actions: {
                        account: {
                            type: "oneOf",
                            values: ["bbbbbbbtoken", "aaaaaatoken"]
                        }
                    }
                }
            }
        );
        const request = supertest(app);
        await sampleRequest(request);
    });

    test("oneOf filter negative", async () => {
        const app = await createApp({
                ...sampleConfig,
                filter: {
                    actions: {
                        account: {
                            type: "oneOf",
                            values: ["gggggggtoken", "aaaaaatoken"]
                        }
                    }
                }
            }
        );
        const request = supertest(app);
        await sampleFilteredRequest(request);
    });

    test("not filter positive", async () => {
        const app = await createApp({
                ...sampleConfig,
                filter: {
                    actions: {
                        account: {
                            type: "not",
                            values: ["gggggggtoken", "aaaaaatoken"]
                        }
                    }
                }
            }
        );
        const request = supertest(app);
        await sampleRequest(request);
    });

    test("not filter negative", async () => {
        const app = await createApp({
                ...sampleConfig,
                filter: {
                    actions: {
                        account: {
                            type: "not",
                            values: ["gggggggtoken", "bbbbbbbtoken"]
                        }
                    }
                }
            }
        );
        const request = supertest(app);
        await sampleFilteredRequest(request);
    });

    test("fromto filter positive", async () => {
        const app = await createApp({
                ...sampleConfig,
                filter: {
                    ref_block_num: {
                        type: "fromTo",
                        from: 0,
                        to: 9999
                    }
                }
            }
        );
        const request = supertest(app);
        await sampleRequest(request);
    });

    test("fromto filter negative", async () => {
        const app = await createApp({
                ...sampleConfig,
                filter: {
                    ref_block_num: {
                        type: "fromTo",
                        from: 0,
                        to: 1
                    }
                }
            }
        );
        const request = supertest(app);
        await sampleFilteredRequest(request);
    });

    test("fromto filter negative 2", async () => {
        const app = await createApp({
                ...sampleConfig,
                filter: {
                    ref_block_num: {
                        type: "fromTo",
                        from: 999,
                        to: 199999
                    }
                }
            }
        );
        const request = supertest(app);
        await sampleFilteredRequest(request);
    });

    test("authorizations filter", async () => {
        const app = await createApp({
                ...sampleConfig,
                filter: {
                    actions: {
                        authorizations: {
                            actor: {
                                type: "oneOf",
                                values: ["bbbbbbbbfrom"]
                            }
                        }
                    }
                }
            }
        );
        const request = supertest(app);
        await sampleRequest(request);
    })
});

import createApp from "../src/app";
import supertest from "supertest";
import {testData} from "./testdata";

let request: supertest.SuperTest<supertest.Test>;


describe('Service unit tests', () => {
    // Applies only to tests in this describe block
    beforeAll(async () => {
        const app = await createApp({
                sponsors: [
                    {
                        account: "eosio",
                        privateKey: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
                    }
                ]
            }
        );
        request = supertest(app);
    });

    test("Get sponsors' public keys", async () => {
        const response = await request.get('/sponsors');

        expect(response.status).toBe(200);
        expect(response.text).toBe('["EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"]');
    });

    test("Sign sample transaction", async () => {
        const response = await request.post('/sponsor')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(testData[0].req));

        expect(response.status).toBe(200);
        expect(response.text).toBe(JSON.stringify(testData[0].res));
    });

    test("Invalid private key", async () => {
        try {
            const app = await createApp({
                    sponsors: [
                        {
                            account: "eosio",
                            privateKey: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
                        },
                        {
                            account: "test",
                            privateKey: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD4"
                        },
                    ]
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
            .send(JSON.stringify({serializedTransaction: 10, chainId: ""}));
        expect(response.status).toBe(400);
    });

    test("Invalid request body (chainId type)", async () => {
        const response = await request.post('/sponsor')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({serializedTransaction: [10], chainId: 10}));

        expect(response.status).toBe(400);
    });

    test("Invalid transaction", async () => {
        const response = await request.post('/sponsor')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({serializedTransaction: [10], chainId: "lol"}));

        expect(response.status).toBe(500);
    });
});

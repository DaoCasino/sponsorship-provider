import createApp from "../src/app";
import supertest from "supertest";

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

    test("Get sponsors' public keys" , async () => {
        const response = await request.get('/sponsors');

        expect(response.status).toBe(200);
        expect(response.text).toBe('["EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"]');
    });
});

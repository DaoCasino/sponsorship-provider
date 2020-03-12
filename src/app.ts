import express from "express";
import bodyParser from "body-parser";
import {Sponsorship} from "./sponsorship";
import {Config, FullSponsor} from "./config";

const ecc = require('eosjs-ecc');


const createApp = async (config: Config) => {
    const {sponsors} = config;
    const fullSponsors: FullSponsor[] = sponsors.map(sponsor => {
        if (!ecc.isValidPrivate(sponsor.privateKey)) {
            throw new Error(`The ${sponsor.privateKey} is not a valid private key`);
        }
        return {...sponsor, publicKey: ecc.privateToPublic(sponsor.privateKey)}
    });
    const sponsorPublicKeys = fullSponsors.map(sponsor => sponsor.publicKey);

    const sponsorship = await Sponsorship.create(fullSponsors);

    const app = express();
    app.use(bodyParser.json());

    app.get("/sponsors", (req, res) => {
        res.send(sponsorPublicKeys);
    });

    app.post("/sponsor", async (req, res) => {
        const {serializedTransaction, chainId} = req.body as { chainId: string, serializedTransaction: number[] };

        if (!serializedTransaction || !chainId)
            return res.status(400).send(
                {
                    error: "Request body should contain chainId (string) " +
                        "and serializedTransaction (number[] with UInt8 values)"
                }
            );

        if (typeof chainId !== "string")
            return res.status(400).send(
                {error: "chainId should be string"}
            );

        if (!Array.isArray(serializedTransaction) || serializedTransaction.find(value => {
            return typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 255
        })) {
            return res.status(400).send(
                {error: "serializedTransaction should be an number[] of UInt8"}
            );
        }

        try {
            const newTrx = await sponsorship.sign(serializedTransaction, chainId);
            res.send({
                signatures: newTrx.signatures,
                serializedTransaction: Array.from(newTrx.serializedTransaction)
            });
        } catch (e) {
            console.error(e);
            res.status(500).send({error: e.message});
        }
    });


    return app;
};


export default createApp;

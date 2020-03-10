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

    const sponsorship = await Sponsorship.create(fullSponsors, config.nodeUrl);

    const app = express();
    app.use(bodyParser.json());

    app.get("/sponsors", (res, req) => {
        req.send(sponsorPublicKeys);
    });

    app.post("/sponsor", async (req, res) => {
        const trx = req.body;
        try {
            const newTrx = await sponsorship.sign(trx);
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

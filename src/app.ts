import express from "express";
import bodyParser from "body-parser";
import {FilteredError, Sponsorship} from "./sponsorship";
import {Config, FullSponsor} from "./config";
import expressWinston from "express-winston";
import winston from "winston";

const ecc = require('eosjs-ecc');

const createApp = async (config: Config) => {
    const {sponsors, filter} = config;
    const fullSponsors: FullSponsor[] = sponsors.map(sponsor => {
        if (!ecc.isValidPrivate(sponsor.privateKey)) {
            throw new Error(`The ${sponsor.privateKey} is not a valid private key`);
        }
        return {...sponsor, publicKey: ecc.privateToPublic(sponsor.privateKey)}
    });
    const sponsorPublicKeys = fullSponsors.map(sponsor => sponsor.publicKey);

    const sponsorship = await Sponsorship.create(fullSponsors, filter, config.chainId);

    const app = express();
    app.use(bodyParser.json());

    expressWinston.responseWhitelist.push('body.error');
    app.use(expressWinston.logger({
        transports: [
            new (winston.transports.Console)({level: config.logLevel})
        ],
        format: winston.format.combine(
            winston.format.simple()
        ),
        expressFormat: true,
        colorize: true,
        statusLevels: {
            success: "info",
            warn: "warn",
            error: "error"
        }
    }));

    app.get("/sponsors", (req, res) => {
        res.send(sponsorPublicKeys);
    });

    app.post("/sponsor", async (req, res) => {
        const {serializedTransaction} = req.body as { serializedTransaction: number[] };

        if (!Array.isArray(serializedTransaction) || serializedTransaction.find(value => {
            return typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 255
        })) {
            return res.status(400).send(
                {error: "serializedTransaction should be an number[] of UInt8"}
            );
        }

        try {
            const newTrx = await sponsorship.sign(serializedTransaction);
            res.send({
                signatures: newTrx.signatures,
                serializedTransaction: Array.from(newTrx.serializedTransaction)
            });
        } catch (e) {
            if (e instanceof FilteredError)
                return res.status(400).send({error: e.message});
            if (config.logLevel !== "no") {
                // WTF, unknown error
                console.error(e);
            }
            return res.status(500).send({error: e.message});
        }
    });

    return app;
};


export default createApp;

import express from "express";
import bodyParser from "body-parser";
import {FilteredError, Sponsorship} from "./sponsorship";
import {Config, FullSponsor} from "./config";
import expressWinston from "express-winston";
import winston from "winston";
import client from "prom-client";
import http from "http";
import {IncomingMessage, NextFunction} from "connect";

const ecc = require('eosjs-ecc');

const SERVICE_PREFIX = "sponsorship_provider_";
const RESP_TIME_BUCKETS = client.linearBuckets(0, 5, 200);
const RESP_CODE_LABEL = "response_code";

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

    // To disable 304 response code
    app.disable('etag');

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

    // Initialize prometheus metrics
    const register = new client.Registry();

    const responseCodeHistograms = new Map<string, client.Histogram<typeof RESP_CODE_LABEL>>();

    app.use((req: IncomingMessage, res: http.ServerResponse, next: NextFunction) => {
        const url = req.url.startsWith("/") ? req.url.substr(1) : req.url;
        const startTime = new Date().getMilliseconds();
        next();
        const endTime = new Date().getMilliseconds();
        const histogram = responseCodeHistograms.get(url);
        if (!histogram)
            return;
        histogram.observe({response_code: res.statusCode}, endTime - startTime)
    });

    app.get("/sponsors", (req, res) => {
        res.send(sponsorPublicKeys);
    });

    app.get("/metrics", (req, res) => {
        res.send(register.metrics())
    })

    app.get("/ping", (req, res) => {
        res.sendStatus(200);
    })

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
                console.error(e);
            }
            return res.status(500).send({error: e.message});
        }
    });

    // Get all http handlers
    const handlers = app._router.stack
        .filter((l: any) => l.route && l.route.path)
        .map((l: any) => l.route.path)
        .map((path: string) => path.startsWith("/") ? path.substr(1) : path) as string[];


    handlers.forEach(handler => {
        const histogram = new client.Histogram({
            name: `${SERVICE_PREFIX}http_${handler}_ms`,
            help: 'response durations',
            buckets: RESP_TIME_BUCKETS,
            labelNames: [RESP_CODE_LABEL]
        });
        responseCodeHistograms.set(handler, histogram);
        register.registerMetric(histogram);
    })

    client.collectDefaultMetrics({register, prefix: SERVICE_PREFIX});

    return app;
};


export default createApp;

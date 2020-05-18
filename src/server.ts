import createApp from "./app";
import fs from "fs";
import {checkConfig, Config} from "./config";


function getConfig() {
    const configFromEnv = process.env.SPONSOR_CONFIG;
    if (configFromEnv) {
        console.log("Config is taken from environment variable");
        try {
            return JSON.parse(configFromEnv) as Config;
        } catch (e) {
            console.error("Error parsing config from environment variable!");
            throw e;
        }
    }
    const configFile = process.argv[2] || "config.json";
    const configJson = fs.readFileSync(configFile).toString();
    try {
        return JSON.parse(configJson) as Config;
    } catch (e) {
        console.error("Error parsing config!");
        throw e;
    }
}

export function startServer() {
    const config = getConfig()

    checkConfig(config);

    return createApp(config).then(app => {
        /**
         * Start Express server.
         */
        return app.listen(config.port);
    });
}



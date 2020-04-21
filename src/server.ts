import createApp from "./app";
import fs from "fs";
import {checkConfig, Config} from "./config";

const configFile = process.argv[2] || "config.json";
const configJson = fs.readFileSync(configFile).toString();
const config = JSON.parse(configJson) as Config;

checkConfig(config);

export const server = createApp(config).then(app => {
    /**
     * Start Express server.
     */
    return app.listen(config.port, () => {
        console.log(
            `App is running at ${config.port} port`
        );
    });
});

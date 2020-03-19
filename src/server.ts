import createApp from "./app";
import fs from "fs";
import {Config} from "./config";

const configFile = process.argv[2] || "config.json";
const configJson = fs.readFileSync(configFile).toString();
const config = JSON.parse(configJson);


export const server = createApp(config as Config).then(app => {
    /**
     * Start Express server.
     */
    const port = process.env.PORT || 3000;
    return app.listen(port, () => {
        console.log(
            `App is running at http://localhost:${port} in ${app.get("env")} mode`
        );
    });
});

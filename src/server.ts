import createApp from "./app";
import fs from "fs";
import {Config} from "./config";

const configFile = process.argv[2] || "config.json";
const config = JSON.parse(fs.readFileSync(configFile).toString());

export const server = createApp(config as Config).then(app => {
    /**
     * Start Express server.
     */
    const port = process.env.PORT || 3000;
    return app.listen(port, () => {
        console.log(
            `App is running at http://localhost:${port} in ${app.get("env")} mode`
        );
        console.log("Press CTRL-C to stop\n");
    });
});

import cluster from "cluster";
import {cpus} from "os";
import fs from "fs";
import createApp from "./app";
import {Config} from "./config";

const numCPUs = cpus().length;

if (cluster.isMaster) {
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const configFile = process.argv[2] || "config.json";
    const config = JSON.parse(fs.readFileSync(configFile).toString());

    createApp(config as Config).then(app => {
        return app.listen(config.port, () => {
            console.log(
                `Cluster instance is running at http://localhost:${config.port} in ${app.get("env")} mode`
            );
        });
    });
}

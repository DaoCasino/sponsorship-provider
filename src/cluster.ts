import cluster from "cluster";
import {cpus} from "os";
import {startServer} from "./server";

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
    startServer().then((server) => {
        const addr = server.address();
        if (typeof addr === "string")
            console.log(`Cluster instance is running at ${addr}`)
        else
            console.log(`Cluster instance is running at ${addr.port} port`)
    });
}

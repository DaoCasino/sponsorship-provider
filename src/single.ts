import {startServer} from "./server";

startServer().then((server) => {
    const addr = server.address();
    if (typeof addr === "string")
        console.log(`App is running at ${addr}`)
    else
        console.log(`App is running at ${addr.port} port`)
});

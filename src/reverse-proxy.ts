import http from "http";
import { get } from "./http-client";

const portMap: Record<string, number> = {
    "/blog": 3030
}

const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
  
    const destination = Object.entries(portMap).find(entry => req.url?.startsWith(entry[0]));

    if (destination) {
        get({
            path: req.url!,
            port: destination[1],
            callback: result => {
                res.writeHead(result.status);
                res.end(result.body);
            }
        })
    } else {
        res.writeHead(404);
        res.end("Rota não configurada");
    }
};

const server = http.createServer(requestListener);
server.listen(3031);
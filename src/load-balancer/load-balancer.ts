import http, { IncomingMessage } from "http";
import { get, GetResultProps } from "../http-client";
import { RoundRobin } from "./round-robin";
import { LeastConnections } from "./least-connections";
import { Strategy } from "./strategy";

class LoadBalancer {

    constructor(private readonly port: number, private readonly strategy: Strategy) {}

    start() {

        const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {

            const backend = this.strategy.getServer();

            const callback = (result: GetResultProps) => {
                res.writeHead(result.status);
                res.end(result.body);
                this.strategy.onConnectionClose(backend);
            };
            
            console.log(`Enviando request para ${JSON.stringify(backend)}`);
            this.makeRequest(backend, req, callback);
        }

        console.log(`Iniciando Load Balancer na porta ${this.port}`);
        const server = http.createServer(requestListener);
        server.listen(this.port);
    }
    
    private makeRequest(backend: Backend, originalRequest: IncomingMessage, callback: (result: GetResultProps) => void) {
        get({
            headers: originalRequest.headers,
            path: originalRequest.url!,
            port: backend.port,
            host: backend.host,
            callback 
        });
    }
}

const roundRobin = new LeastConnections([
    { port: 3031 }, { port: 3032 }
]);

new LoadBalancer(3030, roundRobin).start();
import http, { IncomingMessage } from "http";
import { get, GetResultProps } from "../http-client";
import { RoundRobin } from "./round-robin";
import { LeastConnections } from "./least-connections";
import { WeightedBackend, WeightedRoundRobin } from "./weighted-round-robin";
import { Strategy, Backend } from "./strategy";
import { argv, exit } from "process";

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

const strategies: Record<string, Strategy> = {
    "round-robin": new RoundRobin([{ port: 3031 }, { port: 3032 }]),
    "least-connections": new LeastConnections([{ port: 3031 }, { port: 3032 }]),
    "weighted-round-robin": new WeightedRoundRobin([{ port: 3031, weight: 3 }, { port: 3032, weight: 22 }])
}

const strategyName = argv[2];
const strategy = strategies[strategyName];

if (strategy === undefined) {
    console.log(`Estrategia ${strategyName} é invalida, Por favor escolha uma das estrategias: ${Object.keys(strategies).join(", ")}`);
    exit(1);
}
 
new LoadBalancer(3030, strategy).start();
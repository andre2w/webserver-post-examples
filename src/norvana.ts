import http, { IncomingMessage } from "http";
import path from "path";
import { RouteMapper } from "./route-mapper";
import { ServeFile, ServeFileProps } from "./webserver/serve-file";
import { Backend, Strategy } from "./load-balancer/strategy";
import { get, GetResultProps } from "./http-client";
import { RoundRobin } from "./load-balancer/round-robin";
import { argv, exit } from "process";
import { LeastConnections } from "./load-balancer/least-connections";
import { WeightedRoundRobin } from "./load-balancer/weighted-round-robin";

interface NorvanaRoute {
    matcher: RegExp;
    strategy: Strategy;
};

type NorvanaProps = ServeFileProps & {
    reverseProxy: NorvanaRoute[];
    port: number;
};

class Norvana {
    private readonly routeMapper: RouteMapper<NorvanaRoute>;
    private readonly serveFile: ServeFile;
    private readonly port: number;

    constructor(norvanaProps: NorvanaProps) {
        this.routeMapper = new RouteMapper<NorvanaRoute>(norvanaProps.reverseProxy);
        this.serveFile = new ServeFile(norvanaProps);
        this.port = norvanaProps.port;
    }

    start() {
        const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
            /**
             * Faz o trabalho do proxy reverso e pega a rota necessaria
             */
            const destination = this.routeMapper.routeFor(req.url!);

            if (destination === undefined) {
                /**
                 * Serve arquivos estaticos assim como um webserver
                 */
                this.serveFile.serveFile(response => {
                    res.writeHead(response.status, { 'Content-Type': 'text/html' });
                    res.end(response.content);
                }, req.url!);
                return;
            }

            /**
             * Faz o trabalho do load balancer e define o servidor
             */
            const backend = destination.strategy.getServer();

            const callback = (result: GetResultProps) => {
                res.writeHead(result.status, { 'Content-Type': 'text/html' });
                res.end(result.body);
                destination.strategy.onConnectionClose(backend);
            };

            /**
             * Faz o request para o servidor na rota correta e balanceado
             */
            this.makeRequest(backend, req, callback);
        }

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

const port = Number.isInteger(parseInt(argv[2])) ? parseInt(argv[2]) : 3030;

const strategies: Record<string, Strategy> = {
    "round-robin": new RoundRobin([{ port: 3031 }, { port: 3032 }]),
    "least-connections": new LeastConnections([{ port: 3031 }, { port: 3032 }]),
    "weighted-round-robin": new WeightedRoundRobin([{ port: 3031, weight: 3 }, { port: 3032, weight: 22 }])
}

const strategyName = argv[3];
const strategy = strategies[strategyName];

if (strategy === undefined) {
    console.log(`Estrategia ${strategyName} é invalida, Por favor escolha uma das estrategias: ${Object.keys(strategies).join(", ")}`);
    exit(1);
}

new Norvana({
    port,
    rootFolder: path.join(__dirname, "..", "pages"),
    cgiBinRootFolder: path.join(__dirname, "..", "scripts"),
    cgiBinMapping: [
        { matcher: /^\/cgi-bin/, script: "cgi-bin-test.js" },
        { matcher: /^\/sleep/, script: "sleep.js" }
    ],
    reverseProxy: [
        { matcher: /^\/blog/, strategy }
    ]
}).start();
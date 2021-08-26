import http, { IncomingMessage } from "http";
import { get, GetResultProps } from "../http-client";

interface Backend {
    host?: string;
    port: number;
}

interface Strategy {
    getServer: () => Backend;
    onConnectionClose(backend: Backend): void;
}

class RoundRobin implements Strategy {
    private index = -1; 

    constructor(private readonly backends: Backend[]) {}

    getServer(): Backend {
        this.index++;
        if (this.index >= this.backends.length) {
            this.index = 0;
        }

        return this.backends[this.index];
    }    

    onConnectionClose(backend: Backend) {

    }
}

class LeastConnections implements Strategy {

    /**
     * Cria um mapa com o numero de conexoes em cada backend
     */
    private readonly connections: Map<Backend, number>;

    constructor(backends: Backend[]) {
        if (backends.length === 0) {
            throw new Error("Não é possivel criar uma estratégia sem backends")
        }
 
       this.connections = new Map();
       backends.forEach(backend => this.connections.set(backend, 0));
    }

    getServer(): Backend {
        console.log(`Escolhendo uma conexao`);
        const backend = this.pickLeastConnectedBackend();
        console.log(`Backend utilizado ${JSON.stringify(backend)}`);
        this.connections.set(backend, this.connections.get(backend)! + 1);
        return backend;
    }

    /**
     * Seleciona o Backend com o menor numero de conexões comparando todos os backends
     * Não é demorado porque o numero de Backends é pequeno 
     * @returns Backend
     */
    private pickLeastConnectedBackend(): Backend{
        let selectedBackend: [Backend, number] | undefined;

        for (const entry of this.connections.entries()) {
            if (selectedBackend === undefined) {
                selectedBackend = entry;
            }

            if (entry[1] < selectedBackend[1]) {
                selectedBackend = entry;
            }
        }

        const backend = selectedBackend![0];
        return backend;
    }

    /**
     * Diminui o numero de conexões no backend  
     * @param backend Backend
     */
    onConnectionClose(backend: Backend) {
        this.connections.set(backend, this.connections.get(backend)! - 1);
    }
}

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
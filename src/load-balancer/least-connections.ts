import { Strategy, Backend } from "./strategy";

export class LeastConnections implements Strategy {

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
        const backend = this.pickLeastConnectedBackend();
        this.connections.set(backend, this.connections.get(backend)! + 1);
        return backend;
    }

    /**
     * Seleciona o Backend com o menor numero de conexões comparando todos os backends
     * Não é demorado porque o numero de Backends é pequeno 
     * @returns Backend
     */
    private pickLeastConnectedBackend(): Backend {
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
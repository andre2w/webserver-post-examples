import { Strategy, Backend } from "./strategy";

export class RoundRobin implements Strategy {
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
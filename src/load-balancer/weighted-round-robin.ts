import { Strategy, Backend } from "./strategy"

export type WeightedBackend = Backend & {
    weight: number
}

export class WeightedRoundRobin implements Strategy {
    private index = -1; 
    private readonly backends: WeightedBackend[];
    private readonly totalWeight: number;
    
    /**
     * Transforma a propriedade weight do backend em um valor sequencial somando com valor anterior 
     * E calcula o peso total para utilizarmos como valor maximo do indice
     * @param backends WeightedBackend[]
     */ 
    constructor(backends: WeightedBackend[]) {
       this.backends = backends.map((backend, index) => {
           if (backend.weight <= 0) {
               throw new Error(`Weight tem que ser maior que 0, valor atual: ${backend.weight}`)
           }

           if (index === 0) {
               return backend
           } else {
               return {
                   ...backend,
                   weight: backend.weight + backends[index-1].weight
               };
           }
       });

       this.totalWeight = backends.reduce((acc, backend) => acc + backend.weight, 0)
    }

    getServer(): Backend {
        this.index++;
        if (this.index > this.totalWeight) {
            this.index = 0;
        }

        /**
         * Seleciona o backend em que o indice esteja dentro do weight 
         */
        return this.backends.reduce((acc, backend) => {
            if (this.index > acc.weight && this.index <= backend.weight) {
                return backend;
            } else {
                return acc;
            }
        }, { port: 0, weight: -1 });
    }    

    onConnectionClose(backend: Backend) {}
}
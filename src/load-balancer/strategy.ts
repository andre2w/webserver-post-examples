export interface Backend {
    host?: string;
    port: number;
}

export interface Strategy {
    getServer: () => Backend;
    onConnectionClose(backend: Backend): void;
}
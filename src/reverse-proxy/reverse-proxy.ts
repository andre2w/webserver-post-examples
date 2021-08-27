import http, { IncomingMessage } from "http";
import { get, GetResultProps } from "../http-client";
import { RouteMapper } from "../route-mapper";

/**
 * Cria um mapeamento de uma rota para uma porta.
 * Nesse caso esperamos que todas as rotas serão mapeadas localmente
 */
export interface MappedRoute {
    matcher: RegExp,
    port: number,
    host?: string,
}

type Route = Pick<MappedRoute, "port" | "host">

class ReverseProxy {
    private readonly routeMapper: RouteMapper<MappedRoute>;
    private readonly port: number;

    constructor(
        port: number,
        mappedRoutes: MappedRoute[]
    ) {
        this.port = port;
        this.routeMapper = new RouteMapper(mappedRoutes);
    }

    start() {
        
        const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
        
           const destination = this.routeMapper.routeFor(req.url!);

            if (destination) {
                const callback = (result: GetResultProps) => {
                    res.writeHead(result.status);
                    res.end(result.body);
                };

                this.makeRequest(destination, req, callback);
            } else {
                res.writeHead(404);
                res.end("Rota não configurada");
            }
        };

        const server = http.createServer(requestListener);
        server.listen(this.port);
    }

    private makeRequest(route: Route, originalRequest: IncomingMessage, callback: (result: GetResultProps) => void) {
        get({
            headers: originalRequest.headers,
            path: originalRequest.url!,
            port: route.port,
            host: route.host,
            callback 
        });
    }
}

new ReverseProxy(3030, [
    { matcher: /^\/blog/, port: 3031 }
]).start();
import http, { IncomingMessage } from "http";
import { get, GetResultProps } from "../http-client";

/**
 * Cria um mapeamento de uma rota para uma porta.
 * Nesse caso esperamos que todas as rotas serão mapeadas localmente
 */
interface MappedRoute {
    matcher: RegExp,
    port: number,
    host?: string,
}

type Route = Pick<MappedRoute, "port" | "host">

/**
 * Busca no mapeamento se a rota atual esta mapeada para alguma porta. 
 * Ele verifica o inicio da rota, então uma rota como:
 *                    /blog/posts/webserver.ts 
 * será mapeada para a porta 3030 como foi configurado em portMap. 
 */
class RouteMapper {
    constructor(private readonly mappedRoutes: MappedRoute[]) {}

    routeFor(url: string): Route | undefined {
        return this.mappedRoutes.find(route => url.match(route.matcher));
    }
}

class ReverseProxy {
    private readonly routeMapper: RouteMapper;
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
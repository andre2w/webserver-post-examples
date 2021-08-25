import http from "http";
import { get } from "./http-client";

/**
 * Cria um mapeamento de uma rota para uma porta.
 * Nesse caso esperamos que todas as rotas serão mapeadas localmente
 */
const portMap: Record<string, number> = {
    "/blog": 3030
}

const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
  
    /**
     * Busca no mapeamento se a rota atual esta mapeada para alguma porta. 
     * Ele verifica o inicio da rota, então uma rota como:
     *                    /blog/posts/webserver.ts 
     * será mapeada para a porta 3030 como foi configurado em portMap. 
     */
    const destination = Object.entries(portMap).find(entry => req.url?.startsWith(entry[0]));

    if (destination) {
        get({
            path: req.url!,
            port: destination[1],
            callback: result => {
                res.writeHead(result.status);
                res.end(result.body);
            }
        })
    } else {
        res.writeHead(404);
        res.end("Rota não configurada");
    }
};

const server = http.createServer(requestListener);
server.listen(3031);
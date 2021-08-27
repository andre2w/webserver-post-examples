/**
 * Busca no mapeamento se a rota atual esta mapeada para alguma porta. 
 * Ele verifica o inicio da rota, então uma rota como:
 *                    /blog/posts/webserver.ts 
 * será mapeada para a porta 3030 como foi configurado em portMap. 
 */
export class RouteMapper<T extends { matcher: RegExp }> {
    constructor(private readonly mappedRoutes: T[]) {}

    routeFor(url: string): T | undefined {
        return this.mappedRoutes.find(route => url.match(route.matcher));
    }
}


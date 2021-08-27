import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { RouteMapper } from "../route-mapper";

export interface CgiBinRoute {
    matcher: RegExp; 
    script: string;
}

export interface ServeFileProps {
    rootFolder: string,
    cgiBinMapping: CgiBinRoute[],
    cgiBinRootFolder: string
}

export interface Response {
    status: number;
    content: Buffer;
}

export class ServeFile {
    private readonly rootFolder: string;
    private readonly cgiBinMapping: RouteMapper<CgiBinRoute>
    private readonly cgiBinRootFolder: string;

    constructor(props: ServeFileProps) {
        this.rootFolder = props.rootFolder;
        this.cgiBinMapping = new RouteMapper<CgiBinRoute>(props.cgiBinMapping);
        this.cgiBinRootFolder = props.cgiBinRootFolder;
    }
    /**
     * 
     * Esse metodo tenta ler um arquivo baseado na url passada
     * se a url for /blog/posts/webserver.html ele vai tentar ler em um arquivo
     * em ./pages/blog/posts/webserver.html caso não encontre ele vai retornar
     * o conteudo de 404.html  
     * @param filePath 
     * @returns { status: number; content: Buffer }
     */
    serveFile(callback: (response: Response) => void, filePath: string): void {
        if (filePath === undefined || filePath === "/") {
            this.loadPage("index.html", callback);
            return;
        } 
        
        const route = this.cgiBinMapping.routeFor(filePath);

        if (route !== undefined) {
            this.cgiBin(route.script, callback);
        } else {
            this.loadPage(filePath, callback);
        }
    }

    /**
     * Tenta ler um arquivo dentro do diretorio pages 
     * @param filePath string
     * @returns Response
     */
    private loadPage(filePath: string, callback: (response: Response) => void) {
        const parsedPath = filePath.split("/");
        fs.readFile(path.join(this.rootFolder, ...parsedPath), (err, data) => {
            if (err) {
                callback({ status: 500, content: Buffer.from("Alguma coisa errada não está correta \n" + err.message) });
            } else {
                callback({ status: 200, content: data});
            }
        });
    }

    private cgiBin(scriptPath: string, callback: (response: Response) => void) {
        exec(`node.exe ${path.join(this.cgiBinRootFolder, scriptPath)}`, (err, stdout) => {
            if (err) {
                callback({ status: 500, content: Buffer.from(err.message) });
                return;
            }
            callback({ status: 200, content: Buffer.from(stdout) })
        });
    }
}
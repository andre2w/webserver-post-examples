import http from "http";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

interface Response {
    status: number;
    content: Buffer;
}

interface WebserverProps {
    port: number,
    rootFolder: string,
    cgiBinMapping: Record<string, string>,
    cgiBinRootFolder: string
}

class Webserver {
    constructor(private readonly props: WebserverProps) {}

    start() {
        const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
            const result = this.serveFile(req.url);
            res.writeHead(result.status);
            res.end(result.content);
        };

        const server = http.createServer(requestListener);
        server.listen(this.props.port);
    }

    /**
     * Esse metodo tenta ler um arquivo baseado na url passada
     * se a url for /blog/posts/webserver.html ele vai tentar ler em um arquivo
     * em ./pages/blog/posts/webserver.html caso não encontre ele vai retornar
     * o conteudo de 404.html  
     * @param filePath 
     * @returns { status: number; content: Buffer }
     */
    private serveFile(filePath?: string): Response {
        if (filePath === undefined || filePath === "/") {
            return this.loadPage("index.html");
        }

        try {

            if (this.props.cgiBinMapping[filePath] !== undefined) {
                return this.cgiBin(this.props.cgiBinMapping[filePath]);
            } else {
                return this.loadPage(filePath);
            }

        } catch {
            return this.notFound();
        }
    }

    /**
     * Tenta ler um arquivo dentro do diretorio pages 
     * @param filePath string
     * @returns Response
     */
    private loadPage(filePath: string) {
        const parsedPath = filePath.split("/");
        const content = fs.readFileSync(path.join(this.props.rootFolder, ...parsedPath));
        return { status: 200, content };
    }

    private notFound() {
        const notFound = fs.readFileSync(path.join(this.props.rootFolder, "404.html"));
        return { status: 404, content: notFound }; 
    }

    private cgiBin(scriptPath: string) {
        const result = execSync(`node.exe ${path.join(this.props.cgiBinRootFolder, scriptPath)}`);
        return { status: 200, content: result }
    }
}

const webserver = new Webserver({
    port: 3030,
    rootFolder: path.join(__dirname, "..", "..", "pages"),
    cgiBinRootFolder: path.join(__dirname, "..", "..", "scripts"),
    cgiBinMapping: {
        "/cgi-bin": "cgi-bin-test.js"
    }
});
webserver.start();
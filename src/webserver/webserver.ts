import http from "http";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { argv } from "process";

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
            console.log(`Webserver na porta ${this.props.port} recebeu request`);

            const callback = (response: Response) => {
                res.writeHead(response.status);
                res.end(response.content);
            }

            const result = this.serveFile(callback, req.url!);
        };

        console.log(`Iniciando webserver na porta ${this.props.port}`);
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
    private serveFile(callback: (response: Response) => void, filePath: string): void {
        if (filePath === undefined || filePath === "/") {
            this.loadPage("index.html", callback);
        } else if (this.props.cgiBinMapping[filePath!] !== undefined) {
            this.cgiBin(this.props.cgiBinMapping[filePath], callback);
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
        fs.readFile(path.join(this.props.rootFolder, ...parsedPath), (err, data) => {
            if (err) {
                callback({ status: 500, content: Buffer.from("Alguma coisa errada não está correta") });
            } else {
                callback({ status: 200, content: data});
            }
        });
    }

    private cgiBin(scriptPath: string, callback: (response: Response) => void) {
        const result = exec(`node.exe ${path.join(this.props.cgiBinRootFolder, scriptPath)}`, (err, stdout) =>
            callback({ status: 200, content: Buffer.from(stdout) })
        );
    }
}

const port = Number.isInteger(parseInt(argv[2])) ? parseInt(argv[2]) : 3031;

const webserver = new Webserver({
    port,
    rootFolder: path.join(__dirname, "..", "..", "pages"),
    cgiBinRootFolder: path.join(__dirname, "..", "..", "scripts"),
    cgiBinMapping: {
        "/cgi-bin": "cgi-bin-test.js",
        "/sleep": "sleep.js"
    }
});
webserver.start();
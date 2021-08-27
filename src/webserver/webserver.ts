import http from "http";
import path from "path";
import { argv } from "process";
import { ServeFile, ServeFileProps, Response } from "./serve-file";

export type WebserverProps = ServeFileProps & {
    port: number,
};

class Webserver {
    private readonly port: number;
    private readonly serveFile: ServeFile;

    constructor(private readonly props: WebserverProps) {
        this.port = props.port;
        this.serveFile = new ServeFile(props);
    }

    start() {
        const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
            console.log(`Webserver na porta ${this.props.port} recebeu request`);

            const callback = (response: Response) => {
                res.writeHead(response.status);
                res.end(response.content);
            }

            this.serveFile.serveFile(callback, req.url!);
        };

        console.log(`Iniciando webserver na porta ${this.props.port}`);
        const server = http.createServer(requestListener);
        server.listen(this.props.port);
    }
}

const port = Number.isInteger(parseInt(argv[2])) ? parseInt(argv[2]) : 3031;

const webserver = new Webserver({
    port,
    rootFolder: path.join(__dirname, "..", "..", "pages"),
    cgiBinRootFolder: path.join(__dirname, "..", "..", "scripts"),
    cgiBinMapping: [
        { matcher: /^\/cgi-bin/, script: "cgi-bin-test.js" },
        { matcher: /^\/sleep/, script: "sleep.js" }
    ]
});
webserver.start();
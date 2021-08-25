import http from "http";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

interface Response {
    status: number;
    content: Buffer;
}

const notFound = () => {
    const notFound = fs.readFileSync(path.join(__dirname, "..", "pages", "404.html"));
    return { status: 404, content: notFound }; 
}

/**
 * Executa um arquivo .js dentro do folder scripts e retorna o stdout
 * como o conteudo da pagina.
 * 
 * Executa usando node.exe porque estou usando o windows e o execFileSync funciona 
 * através do cmd e não powershell 
 * @param scriptPath string
 * @returns Response
 */
const cgiBin = (scriptPath: string) => {
    const result = execSync(`node.exe ${path.join(__dirname, "..", "scripts", scriptPath)}`);
    return { status: 200, content: result }
}

/**
 * Mapeia uma url para a execução de um script com o metodo cgiBin
 */
const routeMap: Record<string, () => Response> = {
    "/cgi-bin": () => { return cgiBin("cgi-bin-test.js") }
}

/**
 * Tenta ler um arquivo dentro do diretorio pages 
 * @param filePath string
 * @returns Response
 */
const loadPage = (filePath: string) => {
    const parsedPath = filePath.split("/");
    const content = fs.readFileSync(path.join(__dirname, "..", "pages", ...parsedPath));
    return { status: 200, content };
}

/**
 * Esse metodo tenta ler um arquivo baseado na url passada
 * se a url for /blog/posts/webserver.html ele vai tentar ler em um arquivo
 * em ./pages/blog/posts/webserver.html caso não encontre ele vai retornar
 * o conteudo de 404.html  
 * @param filePath 
 * @returns { status: number; content: Buffer }
 */
const serveFile: (filepath?: string) => Response = (filePath) => {
    if (filePath === undefined || filePath === "/") {
        const index = fs.readFileSync(path.join(__dirname, "..", "pages", "index.html"));
        return { status: 200, content: index };
    }

    try {

        if (routeMap[filePath] !== undefined) {
            return routeMap[filePath]();
        } else {
            return loadPage(filePath);
        }

    } catch {
        return notFound();
    }
}

const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const result = serveFile(req.url);
    res.writeHead(result.status);
    res.end(result.content);
};

const server = http.createServer(requestListener);
server.listen(3030);
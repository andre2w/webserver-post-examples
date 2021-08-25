import http from "http";
import path from "path";
import fs from "fs";

/**
 * Esse metodo tenta ler um arquivo baseado na url passada
 * se a url for /blog/posts/webserver.html ele vai tentar ler em um arquivo
 * em ./pages/blog/posts/webserver.html caso não encontre ele vai retornar
 * o conteudo de 404.html  
 * @param filePath 
 * @returns { status: number; content: Buffer }
 */
const serveFile = (filePath?: string) => {
    if (filePath === undefined || filePath === "/") {
        const index = fs.readFileSync(path.join(__dirname, "..", "pages", "index.html"));
        return { status: 200, content: index };
    }

    try {
        const parsedPath = filePath.split("/");
        const content = fs.readFileSync(path.join(__dirname, "..", "pages", ...parsedPath));
        return { status: 200, content };
    } catch {
        const notFound = fs.readFileSync(path.join(__dirname, "..", "pages", "404.html"));
        return { status: 404, content: notFound };
    }
}

const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const result = serveFile(req.url);
    res.writeHead(result.status);
    res.end(result.content);
};

const server = http.createServer(requestListener);
server.listen(3030);
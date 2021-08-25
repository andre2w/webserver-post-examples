import http from "http";

interface GetResultProps {
    status: number;
    body: string;
}

interface GetProps {
    path: string;
    port: number;
    callback: (result: GetResultProps) => void;
}

export function get({ path, port, callback }: GetProps): void {
    let body = "";
    http.get({ path, port }, (res) => {
        res.on('data', chunk => {
            body += chunk;
        });

        res.on('close', () => callback({ status: res.statusCode!, body }) );
    });
}
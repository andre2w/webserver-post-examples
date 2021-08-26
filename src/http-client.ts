import http, { IncomingHttpHeaders, IncomingMessage } from "http";

export interface GetResultProps {
    status: number;
    body: string;
}

interface GetProps {
    port: number;
    host?: string;
    path: string;
    headers: IncomingHttpHeaders
    callback: (result: GetResultProps) => void;
}

export function get({ callback, ...requestOptions }: GetProps): void {
    let body = "";

    http.get(requestOptions, (res) => {
        res.on('data', chunk => {
            body += chunk;
        });

        res.on('close', () => callback({ status: res.statusCode!, body }) );
    });
}
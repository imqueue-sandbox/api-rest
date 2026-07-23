/*!
 * ISC License
 *
 * Copyright (c) 2026, Imqueue Sandbox
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
import * as net from 'node:net';

/**
 * Checks if a given port number is free to use
 *
 * @param {number} port
 * @return {Promise<boolean>}
 */
export async function portOpen(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        const server = net.createServer();

        server.once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                return resolve(false);
            }

            reject(err);
        });

        server.once('listening', () => {
            server.once('close', () => resolve(true)).close();
        });

        server.listen(port);
    });
}

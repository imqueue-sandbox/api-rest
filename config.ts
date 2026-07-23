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
import type { IMQClientOptions } from '@imqueue/rpc';
import { DEFAULT_IMQ_CLIENT_OPTIONS as opts } from '@imqueue/rpc';

try {
    // native .env files support; throws when no .env file exists
    process.loadEnvFile();
} catch {
    /* no .env file - rely on the process environment */
}

export const clientOptions: Partial<IMQClientOptions> = {
    cluster: (process.env['IMQ_REDIS'] || `${opts.host}:${opts.port}`)
        .split(',')
        .map((instance: string) => {
            const [host, port] = instance.split(':');

            return { host, port: Number(port) };
        }),
    logger: console,
};

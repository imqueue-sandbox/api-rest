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
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ResponseError } from '../ResponseError.js';

/**
 * Maps a ResponseError code to an HTTP status. Unknown codes fall back to 400
 * (client error) since every ResponseError thrown by the orchestrator is a
 * domain-level rejection rather than an internal failure.
 */
function statusForCode(code: string, message: string): number {
    switch (code) {
        case 'AUTH_ERROR':
            return 401;
        case 'USER_CREDENTIALS_ERROR':
        case 'USER_LOGIN_ERROR':
            return 401;
        case 'NOT_FOUND':
            return 404;
        case 'USER_EMAIL_ERROR':
            return /duplicate|exists/i.test(message) ? 409 : 400;
        default:
            return 400;
    }
}

/**
 * Wraps an async request handler so rejected promises are forwarded to the
 * error middleware regardless of the express version in use.
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Terminal express error handler. Emits a GraphQL-compatible error envelope
 * (`{ errors: [{ message, extensions: { code } }] }`) so a single front-end
 * error-mapping routine works against both the GraphQL and the REST gateway.
 */
export function errorMiddleware(logger: { error: (...a: any[]) => void }) {
    return (err: any, _req: Request, res: Response, _next: NextFunction) => {
        if (err instanceof ResponseError) {
            const code = String(err.extensions.code || 'ERROR');
            const status = statusForCode(code, err.message);

            res.status(status).json({
                errors: [{ message: err.message, extensions: { code } }],
            });

            return;
        }

        logger.error(err);

        res.status(500).json({
            errors: [
                {
                    message: err?.message || 'Internal Server Error',
                    extensions: { code: 'INTERNAL_ERROR' },
                },
            ],
        });
    };
}

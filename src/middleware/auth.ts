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
import type { NextFunction, Request, Response } from 'express';
import type { Context } from '../types.js';

/**
 * Verifies the `X-Auth-User` JWT token via the auth service and returns the
 * associated user, or null if there is no valid token. Ports `resolveAuthUser`
 * from the GraphQL gateway.
 */
export async function resolveAuthUser(
    auth: any,
    token?: string,
): Promise<any> {
    if (!token) {
        return null;
    }

    try {
        return await auth.verify(token);
    } catch {
        return null;
    }
}

/**
 * Builds an express middleware that resolves the authenticated user for each
 * request off the `X-Auth-User` header and attaches a per-request orchestration
 * context to `res.locals.context`.
 */
export function authMiddleware(base: Context) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const token = (req.header('x-auth-user') || '').trim();
        const authUser = await resolveAuthUser(base.auth, token);

        res.locals.context = { ...base, authUser } as Context;
        next();
    };
}

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
import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Context } from './types.js';
import { asyncHandler } from './middleware/errors.js';
import { NOT_FOUND } from './ResponseError.js';
import { Orchestrator } from './orchestrator.js';

/**
 * Pulls the per-request orchestration context assembled by the auth
 * middleware.
 */
function ctx(res: Response): Context {
    return res.locals.context as Context;
}

/**
 * Builds a UserFilters object from the query string of a users list request.
 */
function usersFilter(req: Request): any {
    const filter: any = {};

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.isAdmin !== undefined) {
        filter.isAdmin = req.query.isAdmin === 'true';
    }

    for (const field of ['email', 'firstName', 'lastName']) {
        if (typeof req.query[field] === 'string') {
            filter[field] = req.query[field];
        }
    }

    return Object.keys(filter).length ? filter : null;
}

/**
 * Builds the REST router that exposes the orchestrated back-end fleet.
 */
export function createRouter(): Router {
    const router = Router();

    // --------------------------------------------------------------- auth
    router.post(
        '/auth/login',
        asyncHandler(async (req, res) => {
            const { email, password } = req.body || {};

            res.json(await Orchestrator.login(ctx(res), email, password));
        }),
    );

    router.post(
        '/auth/logout',
        asyncHandler(async (req, res) => {
            const { token } = req.body || {};

            res.json(await Orchestrator.logout(ctx(res), token));
        }),
    );

    // -------------------------------------------------------------- users
    router.get(
        '/users/me',
        asyncHandler(async (_req, res) => {
            const user = await Orchestrator.getUser(ctx(res));

            if (!user) {
                throw NOT_FOUND;
            }

            res.json(user);
        }),
    );

    router.get(
        '/users',
        asyncHandler(async (req, res) => {
            res.json(
                await Orchestrator.listUsers(ctx(res), {
                    skip: Number(req.query.skip) || 0,
                    limit: Number(req.query.limit) || 10,
                    filter: usersFilter(req),
                }),
            );
        }),
    );

    router.post(
        '/users',
        asyncHandler(async (req, res) => {
            const user = await Orchestrator.createUser(ctx(res), req.body || {});

            res.status(201).json({ user });
        }),
    );

    router.get(
        '/users/:idOrEmail',
        asyncHandler(async (req, res) => {
            const user = await Orchestrator.getUser(
                ctx(res),
                String(req.params.idOrEmail),
            );

            if (!user) {
                throw NOT_FOUND;
            }

            res.json(user);
        }),
    );

    router.patch(
        '/users/:id',
        asyncHandler(async (req, res) => {
            const user = await Orchestrator.updateUser(
                ctx(res),
                String(req.params.id),
                req.body || {},
            );

            res.json({ user });
        }),
    );

    // ----------------------------------------------------------- user cars
    router.post(
        '/users/:idOrEmail/cars',
        asyncHandler(async (req, res) => {
            const { carId, regNumber } = req.body || {};
            const user = await Orchestrator.addCar(
                ctx(res),
                String(req.params.idOrEmail),
                carId,
                regNumber,
            );

            res.status(201).json({ user });
        }),
    );

    router.delete(
        '/users/:idOrEmail/cars/:carId',
        asyncHandler(async (req, res) => {
            const user = await Orchestrator.removeCar(
                ctx(res),
                String(req.params.carId),
            );

            res.json({ user });
        }),
    );

    // ------------------------------------------------------------- catalog
    router.get(
        '/brands',
        asyncHandler(async (_req, res) => {
            res.json({ brands: await Orchestrator.brands(ctx(res)) });
        }),
    );

    router.get(
        '/cars',
        asyncHandler(async (req, res) => {
            const brand = String(req.query.brand || '');

            res.json({ cars: await Orchestrator.cars(ctx(res), brand) });
        }),
    );

    router.get(
        '/cars/:id',
        asyncHandler(async (req, res) => {
            res.json(await Orchestrator.car(ctx(res), String(req.params.id)));
        }),
    );

    // ---------------------------------------------------------- time-table
    router.get(
        '/options',
        asyncHandler(async (_req, res) => {
            res.json(await Orchestrator.options(ctx(res)));
        }),
    );

    router.get(
        '/reservations',
        asyncHandler(async (req, res) => {
            const date =
                typeof req.query.date === 'string' ? req.query.date : undefined;

            res.json({
                reservations: await Orchestrator.reservations(ctx(res), date),
            });
        }),
    );

    router.get(
        '/reservations/:id',
        asyncHandler(async (req, res) => {
            res.json(
                await Orchestrator.reservation(ctx(res), String(req.params.id)),
            );
        }),
    );

    router.post(
        '/reservations',
        asyncHandler(async (req, res) => {
            res.status(201).json(
                await Orchestrator.reserve(ctx(res), req.body || {}),
            );
        }),
    );

    router.delete(
        '/reservations/:id',
        asyncHandler(async (req, res) => {
            res.json(
                await Orchestrator.cancelReservation(
                    ctx(res),
                    String(req.params.id),
                ),
            );
        }),
    );

    return router;
}

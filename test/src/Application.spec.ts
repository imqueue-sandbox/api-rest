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
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildOpenApi } from '../../src/openapi.js';
import { createRouter } from '../../src/routes.js';

describe('API REST gateway', () => {
    it('exposes the expected REST paths in the OpenAPI document', () => {
        const doc = buildOpenApi('1.0.0-0', 8080);

        for (const path of [
            '/auth/login',
            '/auth/logout',
            '/users/me',
            '/users',
            '/users/{idOrEmail}',
            '/users/{id}',
            '/users/{idOrEmail}/cars',
            '/users/{idOrEmail}/cars/{carId}',
            '/brands',
            '/cars',
            '/cars/{id}',
            '/options',
            '/reservations',
            '/reservations/{id}',
        ]) {
            assert.ok(doc.paths[path], `missing OpenAPI path: ${path}`);
        }
    });

    it('declares the X-Auth-User security scheme', () => {
        const doc = buildOpenApi('1.0.0-0', 8080);

        assert.equal(
            doc.components.securitySchemes.authUser.name,
            'X-Auth-User',
        );
    });

    it('builds an express router exposing the resource routes', () => {
        const router: any = createRouter();
        const routes = router.stack
            .filter((layer: any) => layer.route)
            .map((layer: any) => ({
                path: layer.route.path,
                methods: Object.keys(layer.route.methods),
            }));

        const has = (path: string, method: string) =>
            routes.some(
                (r: any) => r.path === path && r.methods.includes(method),
            );

        assert.ok(has('/auth/login', 'post'));
        assert.ok(has('/users/me', 'get'));
        assert.ok(has('/reservations', 'post'));
        assert.ok(has('/reservations/:id', 'delete'));
        assert.ok(has('/users/:idOrEmail/cars', 'post'));
    });
});

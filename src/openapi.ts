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

/**
 * Builds the OpenAPI 3.0 document describing the REST gateway. This is the REST
 * analogue of the GraphQL gateway's introspectable schema — served as
 * `/openapi.json` and rendered by Swagger UI at the service root.
 *
 * @param {string} version - the running gateway version
 * @param {number} port - the port the gateway is listening on
 */
export function buildOpenApi(version: string, port: number): any {
    const car = {
        type: 'object',
        properties: {
            id: { type: 'string' },
            carId: { type: 'string' },
            make: { type: 'string' },
            model: { type: 'string' },
            type: { type: 'string' },
            years: { type: 'array', items: { type: 'integer' } },
            regNumber: { type: 'string', nullable: true },
        },
    };

    const user = {
        type: 'object',
        properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            isActive: { type: 'boolean' },
            isAdmin: { type: 'boolean' },
            carsCount: { type: 'integer' },
            cars: {
                type: 'array',
                items: { $ref: '#/components/schemas/Car' },
            },
        },
    };

    const reservation = {
        type: 'object',
        properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            start: { type: 'string', nullable: true },
            end: { type: 'string', nullable: true },
            car: { $ref: '#/components/schemas/Car', nullable: true },
            user: { $ref: '#/components/schemas/User', nullable: true },
        },
    };

    const options = {
        type: 'object',
        properties: {
            start: { type: 'string' },
            end: { type: 'string' },
            boxes: { type: 'integer' },
            baseTime: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        key: { type: 'string' },
                        title: { type: 'string' },
                        duration: { type: 'integer' },
                    },
                },
            },
        },
    };

    const errorEnvelope = {
        type: 'object',
        properties: {
            errors: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        extensions: {
                            type: 'object',
                            properties: { code: { type: 'string' } },
                        },
                    },
                },
            },
        },
    };

    const userEnvelope = {
        type: 'object',
        properties: { user: { $ref: '#/components/schemas/User' } },
    };

    const reservationsEnvelope = {
        type: 'object',
        properties: {
            reservations: {
                type: 'array',
                items: { $ref: '#/components/schemas/Reservation' },
            },
        },
    };

    const jsonBody = (schema: any) => ({
        required: true,
        content: { 'application/json': { schema } },
    });
    const jsonResp = (description: string, schema: any) => ({
        description,
        content: { 'application/json': { schema } },
    });

    return {
        openapi: '3.0.3',
        info: {
            title: 'Car Wash Tutorial API (REST)',
            version,
            description:
                'REST/OpenAPI gateway orchestrating the @imqueue back-end ' +
                'fleet (user, auth, car, time-table). A REST-flavoured twin ' +
                'of the GraphQL `api` gateway.',
        },
        servers: [{ url: `http://localhost:${port}` }],
        components: {
            securitySchemes: {
                authUser: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-Auth-User',
                    description: 'JWT auth token issued by POST /auth/login',
                },
            },
            schemas: {
                Car: car,
                User: user,
                Reservation: reservation,
                Options: options,
                Error: errorEnvelope,
                UserEnvelope: userEnvelope,
                ReservationsEnvelope: reservationsEnvelope,
            },
        },
        security: [{ authUser: [] }],
        paths: {
            '/auth/login': {
                post: {
                    tags: ['auth'],
                    summary: 'Log in and obtain a jwt token',
                    security: [],
                    requestBody: jsonBody({
                        type: 'object',
                        required: ['email', 'password'],
                        properties: {
                            email: { type: 'string', format: 'email' },
                            password: { type: 'string' },
                        },
                    }),
                    responses: {
                        200: jsonResp('Authenticated user and token', {
                            type: 'object',
                            properties: {
                                token: { type: 'string' },
                                user: { $ref: '#/components/schemas/User' },
                            },
                        }),
                        401: jsonResp('Invalid credentials', {
                            $ref: '#/components/schemas/Error',
                        }),
                    },
                },
            },
            '/auth/logout': {
                post: {
                    tags: ['auth'],
                    summary: 'Invalidate a jwt token',
                    requestBody: jsonBody({
                        type: 'object',
                        required: ['token'],
                        properties: { token: { type: 'string' } },
                    }),
                    responses: {
                        200: jsonResp('Logout result', {
                            type: 'object',
                            properties: { success: { type: 'boolean' } },
                        }),
                    },
                },
            },
            '/users/me': {
                get: {
                    tags: ['users'],
                    summary: 'Get the authenticated user (with cars)',
                    responses: {
                        200: jsonResp('Current user', {
                            $ref: '#/components/schemas/User',
                        }),
                        401: jsonResp('Not authenticated', {
                            $ref: '#/components/schemas/Error',
                        }),
                    },
                },
            },
            '/users': {
                get: {
                    tags: ['users'],
                    summary: 'List users (non-admins capped at 100)',
                    parameters: [
                        {
                            name: 'skip',
                            in: 'query',
                            schema: { type: 'integer' },
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer' },
                        },
                        {
                            name: 'isActive',
                            in: 'query',
                            schema: { type: 'boolean' },
                        },
                        {
                            name: 'isAdmin',
                            in: 'query',
                            schema: { type: 'boolean' },
                        },
                        {
                            name: 'email',
                            in: 'query',
                            schema: { type: 'string' },
                        },
                        {
                            name: 'firstName',
                            in: 'query',
                            schema: { type: 'string' },
                        },
                        {
                            name: 'lastName',
                            in: 'query',
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: jsonResp('Users page', {
                            type: 'object',
                            properties: {
                                total: { type: 'integer' },
                                items: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/User',
                                    },
                                },
                            },
                        }),
                    },
                },
                post: {
                    tags: ['users'],
                    summary: 'Register (create) a user',
                    security: [],
                    requestBody: jsonBody({
                        type: 'object',
                        required: [
                            'firstName',
                            'lastName',
                            'email',
                            'password',
                        ],
                        properties: {
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            password: { type: 'string' },
                            isActive: { type: 'boolean' },
                        },
                    }),
                    responses: {
                        201: jsonResp('Created user', {
                            $ref: '#/components/schemas/UserEnvelope',
                        }),
                        409: jsonResp('Email already registered', {
                            $ref: '#/components/schemas/Error',
                        }),
                    },
                },
            },
            '/users/{idOrEmail}': {
                get: {
                    tags: ['users'],
                    summary: 'Get a user by id or email',
                    parameters: [
                        {
                            name: 'idOrEmail',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: jsonResp('User', {
                            $ref: '#/components/schemas/User',
                        }),
                        404: jsonResp('Not found', {
                            $ref: '#/components/schemas/Error',
                        }),
                    },
                },
            },
            '/users/{id}': {
                patch: {
                    tags: ['users'],
                    summary: 'Update the authenticated user',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: jsonBody({
                        type: 'object',
                        properties: {
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            password: { type: 'string' },
                            oldPassword: { type: 'string' },
                            isActive: { type: 'boolean' },
                            isAdmin: { type: 'boolean' },
                        },
                    }),
                    responses: {
                        200: jsonResp('Updated user', {
                            $ref: '#/components/schemas/UserEnvelope',
                        }),
                    },
                },
            },
            '/users/{idOrEmail}/cars': {
                post: {
                    tags: ['users'],
                    summary: 'Attach a car to a user (use "me" for self)',
                    parameters: [
                        {
                            name: 'idOrEmail',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: jsonBody({
                        type: 'object',
                        required: ['carId', 'regNumber'],
                        properties: {
                            carId: { type: 'string' },
                            regNumber: { type: 'string' },
                        },
                    }),
                    responses: {
                        201: jsonResp('Updated user', {
                            $ref: '#/components/schemas/UserEnvelope',
                        }),
                    },
                },
            },
            '/users/{idOrEmail}/cars/{carId}': {
                delete: {
                    tags: ['users'],
                    summary: 'Remove a car from a user',
                    parameters: [
                        {
                            name: 'idOrEmail',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                        {
                            name: 'carId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: jsonResp('Updated user', {
                            $ref: '#/components/schemas/UserEnvelope',
                        }),
                    },
                },
            },
            '/brands': {
                get: {
                    tags: ['cars'],
                    summary: 'List car manufacturer (brand) names',
                    security: [],
                    responses: {
                        200: jsonResp('Brands', {
                            type: 'object',
                            properties: {
                                brands: {
                                    type: 'array',
                                    items: { type: 'string' },
                                },
                            },
                        }),
                    },
                },
            },
            '/cars': {
                get: {
                    tags: ['cars'],
                    summary: 'List catalog cars for a brand',
                    security: [],
                    parameters: [
                        {
                            name: 'brand',
                            in: 'query',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: jsonResp('Cars', {
                            type: 'object',
                            properties: {
                                cars: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Car',
                                    },
                                },
                            },
                        }),
                    },
                },
            },
            '/cars/{id}': {
                get: {
                    tags: ['cars'],
                    summary: 'Get a catalog car by id',
                    security: [],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: jsonResp('Car', {
                            $ref: '#/components/schemas/Car',
                        }),
                        404: jsonResp('Not found', {
                            $ref: '#/components/schemas/Error',
                        }),
                    },
                },
            },
            '/options': {
                get: {
                    tags: ['time-table'],
                    summary: 'Get reservation time-table options',
                    security: [],
                    responses: {
                        200: jsonResp('Options', {
                            $ref: '#/components/schemas/Options',
                        }),
                    },
                },
            },
            '/reservations': {
                get: {
                    tags: ['time-table'],
                    summary: 'List reservations for a date',
                    parameters: [
                        {
                            name: 'date',
                            in: 'query',
                            schema: { type: 'string', format: 'date-time' },
                        },
                    ],
                    responses: {
                        200: jsonResp('Reservations', {
                            $ref: '#/components/schemas/ReservationsEnvelope',
                        }),
                    },
                },
                post: {
                    tags: ['time-table'],
                    summary: 'Make a washing reservation',
                    requestBody: jsonBody({
                        type: 'object',
                        required: ['carId', 'type', 'duration'],
                        properties: {
                            userId: { type: 'string' },
                            carId: { type: 'string' },
                            type: { type: 'string' },
                            duration: {
                                type: 'array',
                                items: { type: 'string' },
                                minItems: 2,
                                maxItems: 2,
                            },
                        },
                    }),
                    responses: {
                        201: jsonResp('Updated reservations', {
                            $ref: '#/components/schemas/ReservationsEnvelope',
                        }),
                    },
                },
            },
            '/reservations/{id}': {
                get: {
                    tags: ['time-table'],
                    summary: 'Get a reservation by id',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: jsonResp('Reservation', {
                            $ref: '#/components/schemas/Reservation',
                        }),
                        404: jsonResp('Not found', {
                            $ref: '#/components/schemas/Error',
                        }),
                    },
                },
                delete: {
                    tags: ['time-table'],
                    summary: 'Cancel a reservation',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: jsonResp('Updated reservations', {
                            $ref: '#/components/schemas/ReservationsEnvelope',
                        }),
                    },
                },
            },
        },
    };
}

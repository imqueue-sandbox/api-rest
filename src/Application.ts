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
import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { clientOptions } from '../config.js';
import { auth, car, timeTable, user } from './clients/index.js';
import { authMiddleware } from './middleware/auth.js';
import { errorMiddleware } from './middleware/errors.js';
import { buildOpenApi } from './openapi.js';
import { portOpen } from './network.js';
import { createRouter } from './routes.js';
import type { Context } from './types.js';

const APP_VERSION = '1.0.0-0';

/**
 * Class Application.
 * Implements the express REST/OpenAPI gateway bootstrap and execution. It is
 * the REST-flavoured twin of the GraphQL gateway's Application: it bootstraps
 * the same @imqueue/rpc clients and serves the orchestrated fleet over REST
 * with an OpenAPI contract and Swagger UI (in place of GraphQL/GraphiQL).
 */
export class Application {
    public static env: string = process.env['NODE_ENV'] || 'development';
    public static host: string = hostname();
    public static port: number =
        Number(process.env['API_REST_PORT'] || process.env['API_PORT']) || 8080;
    public static key: string = process.env['API_SSL_KEY'] || '';
    public static cert: string = process.env['API_SSL_CERT'] || '';
    public static isSecure: boolean = !!(
        ~process.argv.indexOf('--SECURED') &&
        Application.key &&
        Application.cert
    );

    private static context: Context;

    /**
     * Starts-up the application
     */
    public static async run(): Promise<HttpServer | HttpsServer> {
        await Application.bootstrapContext();

        const app = express();
        const openapi = buildOpenApi(APP_VERSION, Application.port);

        app.use(compression());
        // CSP disabled so the bundled Swagger UI can load its inline assets
        app.use(helmet({ contentSecurityPolicy: false }));
        app.use(
            cors({
                origin: '*',
                methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
                allowedHeaders: [
                    'Origin',
                    'X-Requested-With',
                    'Content-Type',
                    'Accept',
                    'X-Auth-User',
                ],
            }),
        );
        app.use(express.json());
        app.use(authMiddleware(Application.context));

        // OpenAPI contract + interactive docs (the REST analogue of GraphiQL)
        app.get('/openapi.json', (_req, res) => {
            res.json(openapi);
        });

        // REST resource routes
        app.use('/', createRouter());

        // Swagger UI at the service root
        app.use(
            '/',
            swaggerUi.serve,
            swaggerUi.setup(openapi, {
                customSiteTitle: 'Car Wash Tutorial API (REST)',
            }),
        );

        app.use(errorMiddleware(clientOptions.logger || console));

        return Application.startServer(app);
    }

    /**
     * Instantiates and starts the @imqueue/rpc clients used to orchestrate
     * requests to the back-end services
     */
    private static async bootstrapContext(): Promise<void> {
        Application.context = {
            user: new user.UserClient(clientOptions),
            auth: new auth.AuthClient(clientOptions),
            car: new car.CarClient(clientOptions),
            timeTable: new timeTable.TimeTableClient(clientOptions),
        };

        await Application.context.user.start();
        await Application.context.auth.start();
        await Application.context.car.start();
        await Application.context.timeTable.start();
    }

    /**
     * Starts the HTTP(S) server and binds the express application
     *
     * @param {express.Express} app
     */
    private static async startServer(
        app: express.Express,
    ): Promise<HttpServer | HttpsServer> {
        let port: number = Application.port;

        while (!(await portOpen(port))) {
            port++;
        }

        Application.port = port;

        const server: HttpServer | HttpsServer = Application.isSecure
            ? createHttpsServer(
                  {
                      key: readFileSync(Application.key),
                      cert: readFileSync(Application.cert),
                  },
                  app,
              )
            : createHttpServer(app);

        server.listen(port, () => {
            const logger = clientOptions.logger || console;

            logger.log(
                `Listening at http${Application.isSecure ? 's' : ''}` +
                    `://${Application.host}:${port}`,
            );
            logger.log(`Swagger UI: http://localhost:${port}/`);
            logger.log(`Environment: ${Application.env}`);
        });

        return server;
    }
}

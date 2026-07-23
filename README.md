# api-rest

`api-rest` — a REST/OpenAPI gateway for the @imqueue Car-Wash tutorial fleet.

It orchestrates the **same** back-end services (`user`, `auth`, `car`, `time-table`) as the
GraphQL `api` gateway, over the **same** typed `@imqueue/rpc` clients — but exposes them as a
REST API with an OpenAPI 3 contract and interactive Swagger UI, instead of GraphQL/GraphiQL.
It demonstrates that the imqueue service fleet is transport-agnostic: the API style in front of
it is a free choice.

## Usage

Development mode (rebuilds and restarts on change):

~~~bash
npm run dev
~~~

Production mode:

~~~bash
npm start
~~~

The gateway listens on `API_REST_PORT` (default **8080**). It connects to the fleet over the
Redis message queue configured by `IMQ_REDIS` (default `localhost:6379`).

- Swagger UI: `http://localhost:8080/`
- OpenAPI document: `http://localhost:8080/openapi.json`

Authenticated requests carry the JWT token issued by `POST /auth/login` in the `X-Auth-User`
header.

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Log in, returns `{ token, user }` |
| POST | `/auth/logout` | Invalidate a token |
| GET | `/users/me` | Current user (with cars) |
| GET | `/users` | List users (non-admins capped at 100) |
| GET | `/users/{idOrEmail}` | Get a user by id or email |
| POST | `/users` | Register (create) a user |
| PATCH | `/users/{id}` | Update the authenticated user |
| POST | `/users/{idOrEmail}/cars` | Attach a car (`me` for self) |
| DELETE | `/users/{idOrEmail}/cars/{carId}` | Remove a car |
| GET | `/brands` | Car manufacturer names |
| GET | `/cars?brand=` | Catalog cars for a brand |
| GET | `/cars/{id}` | Catalog car by id |
| GET | `/options` | Time-table options |
| GET | `/reservations?date=` | Reservations for a date |
| GET | `/reservations/{id}` | Reservation by id |
| POST | `/reservations` | Make a reservation |
| DELETE | `/reservations/{id}` | Cancel a reservation |

## License

[ISC License](LICENSE)

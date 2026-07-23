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
import type { Context } from './types.js';
import type { CarDTO, ReservationDTO, UserDTO } from './dto.js';
import {
    bound,
    CAR_FIELDS,
    RESERVATION_FIELDS,
    resolveUserCars,
    toCarDTO,
    toUserDTO,
    USER_CAR_FIELDS,
    USER_FIELDS,
} from './dto.js';
import {
    ERROR_UNAUTHORIZED,
    INVALID_CREDENTIALS,
    NOT_FOUND,
    ResponseError,
    USER_ACCOUNT_BLOCKED,
    USER_DATA_EMPTY,
    USER_EMAIL_EMPTY,
    USER_FIRST_NAME_EMPTY,
    USER_LAST_NAME_EMPTY,
    USER_OLD_PASSWORD_EMPTY,
    USER_OLD_PASSWORD_MISMATCH,
    USER_PASSWORD_EMPTY,
    USER_PASSWORD_MISMATCH,
} from './ResponseError.js';

const [RX_BLOCKED, RX_MISMATCH] = [/blocked/i, /password mismatch/i];

/**
 * Authorization helpers — a REST-native rewrite of the GraphQL gateway's
 * validators. Instead of sniffing a GraphQL query string, they operate on the
 * resolved `authUser` and the explicit route parameters.
 */
function assertAuthenticated(context: Context): any {
    if (!context.authUser) {
        throw ERROR_UNAUTHORIZED;
    }

    return context.authUser;
}

function assertActive(context: Context): any {
    const authUser = assertAuthenticated(context);

    if (!authUser.isActive) {
        throw ERROR_UNAUTHORIZED;
    }

    return authUser;
}

function isAdmin(authUser: any): boolean {
    return !!(authUser && authUser.isActive && authUser.isAdmin);
}

function assertAdmin(context: Context): any {
    const authUser = assertAuthenticated(context);

    if (!isAdmin(authUser)) {
        throw ERROR_UNAUTHORIZED;
    }

    return authUser;
}

/**
 * Ensures the current user either owns the target resource (by id or email) or
 * is an administrator.
 */
function assertOwnerOrAdmin(context: Context, target: string): any {
    const authUser = assertActive(context);

    if (isAdmin(authUser)) {
        return authUser;
    }

    if (
        target &&
        (target === authUser._id ||
            target === String(authUser._id) ||
            target === authUser.email)
    ) {
        return authUser;
    }

    throw ERROR_UNAUTHORIZED;
}

/**
 * Class Orchestrator.
 * Ports the GraphQL gateway's resolvers + mutations into transport-agnostic
 * methods that talk to the back-end fleet and return REST DTOs.
 */
export class Orchestrator {
    // ----------------------------------------------------------------- auth

    /**
     * Logs a user in and returns a jwt token together with the user profile.
     * Ports the `login` mutation.
     */
    public static async login(
        context: Context,
        email: string,
        password: string,
    ): Promise<{ token: string; user: UserDTO | null }> {
        if (!email) {
            throw USER_EMAIL_EMPTY;
        }

        if (!password) {
            throw USER_PASSWORD_EMPTY;
        }

        let token: string | null;
        let user: any;

        try {
            [token, user] = await Promise.all([
                context.auth.login(email, password),
                context.user.fetch(email, [...USER_FIELDS]),
            ]);
        } catch (err: any) {
            if (RX_BLOCKED.test(err.message)) {
                throw USER_ACCOUNT_BLOCKED;
            } else if (RX_MISMATCH.test(err.message)) {
                throw USER_PASSWORD_MISMATCH;
            }

            throw new ResponseError(err.message, 'USER_CREDENTIALS_ERROR');
        }

        if (!(token && user)) {
            throw INVALID_CREDENTIALS;
        }

        return { token, user: await toUserDTO(user, context) };
    }

    /**
     * Logs a user out and invalidates the token. Ports the `logout` mutation.
     */
    public static async logout(
        context: Context,
        token: string,
    ): Promise<{ success: boolean }> {
        const authUser: any = context.authUser || {};
        const verifyEmail: string | undefined =
            authUser.isAdmin && authUser.isActive ? undefined : authUser.email;

        if (!(await context.auth.logout(token, verifyEmail))) {
            throw ERROR_UNAUTHORIZED;
        }

        return { success: true };
    }

    // ---------------------------------------------------------------- users

    /**
     * Fetches a single user by id or email. When no criteria is supplied the
     * authenticated user is used. Ports `fetchUserByIdOrEmail`.
     */
    public static async getUser(
        context: Context,
        idOrEmail?: string,
        withCars = true,
    ): Promise<UserDTO | null> {
        let criteria = idOrEmail;

        if (!criteria) {
            if (!context.authUser) {
                throw ERROR_UNAUTHORIZED;
            }

            criteria = context.authUser.email;
        }

        if (!criteria) {
            return null;
        }

        const user = await context.user.fetch(criteria, [...USER_FIELDS]);

        return toUserDTO(user, context, withCars);
    }

    /**
     * Fetches a collection of users applying filters, with the non-admin limit
     * cap preserved. Ports `fetchUsers` (without Relay cursor connections).
     */
    public static async listUsers(
        context: Context,
        params: {
            skip?: number;
            limit?: number;
            filter?: any;
        },
    ): Promise<{ total: number; items: Array<UserDTO | null> }> {
        const authUser = context.authUser;
        const skip = Number(params.skip) || 0;
        let limit = Number(params.limit) || 10;

        if (!isAdmin(authUser) && limit > 100) {
            limit = 100;
        }

        const filter = params.filter || null;
        const total = await context.user.count(filter);
        const users = await context.user.find(
            filter,
            [...USER_FIELDS],
            skip,
            limit,
        );

        return {
            total,
            items: await Promise.all(
                users.map(u => toUserDTO(u, context, false)),
            ),
        };
    }

    /**
     * Creates a new user (registration). Ports the create branch of the
     * `updateUser` mutation, which the GraphQL gateway treats as an "own"
     * (unauthenticated) operation.
     */
    public static async createUser(
        context: Context,
        input: any,
    ): Promise<UserDTO | null> {
        const data = { ...input };

        delete data.id;
        delete data._id;
        delete data.oldPassword;

        Orchestrator.assertUserFields(data);

        try {
            const user = await context.user.update(data, [...USER_FIELDS]);

            return toUserDTO(user, context, false);
        } catch (err: any) {
            throw Orchestrator.userWriteError(err);
        }
    }

    /**
     * Updates an existing user. Ports the update branch of `updateUser`,
     * including the admin gate for role/active flags and the old-password
     * verification for password changes.
     */
    public static async updateUser(
        context: Context,
        id: string,
        input: any,
    ): Promise<UserDTO | null> {
        const authUser = context.authUser;

        if (
            typeof input.isAdmin === 'boolean' ||
            typeof input.isActive === 'boolean'
        ) {
            assertAdmin(context);
        } else {
            assertOwnerOrAdmin(context, id);
        }

        // updateUser may only target the authenticated user themselves
        if (!authUser || String(authUser._id) !== String(id)) {
            throw ERROR_UNAUTHORIZED;
        }

        const data = { ...input, _id: id };

        delete data.id;

        if (Object.keys(data).length <= 1) {
            throw USER_DATA_EMPTY;
        }

        Orchestrator.assertUserFields(data);

        // password changes require verifying the current password via auth
        if (data.password) {
            if (!data.oldPassword) {
                throw USER_OLD_PASSWORD_EMPTY;
            }

            try {
                await context.auth.login(authUser.email, data.oldPassword);
            } catch {
                throw USER_OLD_PASSWORD_MISMATCH;
            }
        }

        delete data.oldPassword;

        try {
            const user = await context.user.update(data, [...USER_FIELDS]);

            return toUserDTO(user, context, false);
        } catch (err: any) {
            throw Orchestrator.userWriteError(err);
        }
    }

    // ------------------------------------------------------------ user cars

    /**
     * Attaches a car to a user. Ports the `addCar` mutation.
     */
    public static async addCar(
        context: Context,
        idOrEmail: string | undefined,
        carId: string,
        regNumber: string,
    ): Promise<UserDTO | null> {
        const authUser = assertActive(context);
        const target =
            !idOrEmail || idOrEmail === 'me'
                ? String(authUser._id)
                : idOrEmail;

        assertOwnerOrAdmin(context, target);

        try {
            const user = await context.user.addCar(
                target,
                carId,
                (regNumber || '').toUpperCase(),
                [...USER_FIELDS],
            );

            return toUserDTO(user, context, true);
        } catch (err: any) {
            throw new ResponseError(err.message, 'ADD_CAR_ERROR');
        }
    }

    /**
     * Removes a car from the authenticated user. Ports the `removeCar`
     * mutation.
     */
    public static async removeCar(
        context: Context,
        carId: string,
    ): Promise<UserDTO | null> {
        assertActive(context);

        const user = await context.user.removeCar(carId, [...USER_FIELDS]);

        return toUserDTO(user, context, true);
    }

    // -------------------------------------------------------------- catalog

    /**
     * Returns the list of car manufacturer (brand) names.
     */
    public static async brands(context: Context): Promise<string[]> {
        return context.car.brands();
    }

    /**
     * Returns catalog cars for a given brand.
     */
    public static async cars(
        context: Context,
        brand: string,
    ): Promise<Array<CarDTO | null>> {
        const list = await context.car.list(brand, [...CAR_FIELDS]);

        return (list as any[]).map(toCarDTO);
    }

    /**
     * Returns a single catalog car by its identifier.
     */
    public static async car(
        context: Context,
        id: string,
    ): Promise<CarDTO | null> {
        const car = await context.car.fetch(id, [...CAR_FIELDS]);

        if (!car) {
            throw NOT_FOUND;
        }

        return toCarDTO(car);
    }

    // ----------------------------------------------------------- time-table

    /**
     * Returns reservation time-table configuration options.
     */
    public static async options(context: Context): Promise<any> {
        return context.timeTable.config();
    }

    /**
     * Returns the list of reservations for a given date (or the current day).
     * Ports `listReservations`.
     */
    public static async reservations(
        context: Context,
        date?: string,
    ): Promise<ReservationDTO[]> {
        const list = await context.timeTable.list(
            date ? new Date(date).toISOString() : undefined,
            [...RESERVATION_FIELDS],
        );

        return Promise.all(
            (list as any[]).map(r => Orchestrator.toReservationDTO(context, r)),
        );
    }

    /**
     * Returns a single reservation by its identifier. Ports `fetchReservation`.
     */
    public static async reservation(
        context: Context,
        id: string,
    ): Promise<ReservationDTO | null> {
        const record = await context.timeTable.fetch(id, [
            ...RESERVATION_FIELDS,
        ]);

        if (!record) {
            throw NOT_FOUND;
        }

        return Orchestrator.toReservationDTO(context, record);
    }

    /**
     * Makes a car washing reservation. Ports the `reserve` mutation.
     */
    public static async reserve(
        context: Context,
        input: {
            userId?: string;
            carId: string;
            type: string;
            duration: [string, string];
        },
    ): Promise<{ reservations: ReservationDTO[] }> {
        const authUser = assertActive(context);
        const reservation = {
            userId: input.userId || String(authUser._id),
            carId: input.carId,
            type: input.type as any,
            duration: input.duration,
        };

        try {
            const list = await context.timeTable.reserve(reservation as any, [
                ...RESERVATION_FIELDS,
            ]);

            return {
                reservations: await Promise.all(
                    (list as any[]).map(r =>
                        Orchestrator.toReservationDTO(context, r),
                    ),
                ),
            };
        } catch (err: any) {
            throw new ResponseError(err.message, 'ADD_RESERVATION_ERROR');
        }
    }

    /**
     * Cancels an existing reservation. Ports the `cancelReservation` mutation.
     */
    public static async cancelReservation(
        context: Context,
        id: string,
    ): Promise<{ reservations: ReservationDTO[] }> {
        assertActive(context);

        const list = await context.timeTable.cancel(id, [
            ...RESERVATION_FIELDS,
        ]);

        return {
            reservations: await Promise.all(
                (list as any[]).map(r =>
                    Orchestrator.toReservationDTO(context, r),
                ),
            ),
        };
    }

    // -------------------------------------------------------------- helpers

    /**
     * Builds a reservation DTO, resolving the nested car and user objects and
     * applying the same admin/owner visibility rules as the GraphQL gateway
     * (`fetchReservationCar` / `fetchReservationUser`).
     */
    private static async toReservationDTO(
        context: Context,
        reservation: any,
    ): Promise<ReservationDTO> {
        const [car, user] = await Promise.all([
            Orchestrator.reservationCar(context, reservation),
            Orchestrator.reservationUser(context, reservation),
        ]);

        return {
            id: String(reservation.id),
            type: reservation.type,
            start: bound(reservation.duration, 0),
            end: bound(reservation.duration, 1),
            car,
            user,
        };
    }

    private static async reservationCar(
        context: Context,
        reservation: any,
    ): Promise<CarDTO | null> {
        const authUser = context.authUser;

        if (
            !(
                authUser &&
                (isAdmin(authUser) ||
                    String(authUser._id) === String(reservation.userId))
            )
        ) {
            return null;
        }

        try {
            const userCar: any = await context.user.getCar(
                reservation.userId,
                reservation.carId,
            );

            if (!userCar) {
                return null;
            }

            const [resolved] = await resolveUserCars(
                [{ ...userCar }],
                context,
            );

            return resolved;
        } catch {
            return null;
        }
    }

    private static async reservationUser(
        context: Context,
        reservation: any,
    ): Promise<Partial<UserDTO> | null> {
        const authUser = context.authUser;

        try {
            const user: any = await context.user.fetch(reservation.userId, [
                '_id',
                'firstName',
                'lastName',
            ]);

            if (!user) {
                return null;
            }

            if (
                !(
                    authUser &&
                    (isAdmin(authUser) ||
                        String(authUser._id) === String(user._id))
                )
            ) {
                return null;
            }

            return {
                id: String(user._id),
                firstName: user.firstName,
                lastName: user.lastName,
            };
        } catch {
            return null;
        }
    }

    /**
     * Validates that provided (non-empty-required) user fields are not blank.
     * Ports `validateUserArgs`.
     */
    private static assertUserFields(data: any): void {
        for (const option of [
            { field: 'firstName', error: USER_FIRST_NAME_EMPTY },
            { field: 'lastName', error: USER_LAST_NAME_EMPTY },
            { field: 'email', error: USER_EMAIL_EMPTY },
            { field: 'password', error: USER_PASSWORD_EMPTY },
        ]) {
            if (data[option.field] !== undefined && !data[option.field]) {
                throw option.error;
            }
        }
    }

    /**
     * Maps a user write failure to the proper response error, distinguishing a
     * duplicate email from a generic update error.
     */
    private static userWriteError(err: any): ResponseError {
        return new ResponseError(
            err.message,
            /duplicate/i.test(err.message)
                ? 'USER_EMAIL_ERROR'
                : 'UPDATE_USER_ERROR',
        );
    }
}

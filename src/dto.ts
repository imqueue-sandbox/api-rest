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

/**
 * Field projections requested from the back-end services. These mirror the
 * field lists the GraphQL gateway derived per-request from the query AST; in a
 * REST gateway the response shape is fixed, so the projections are constant.
 */
export const USER_FIELDS = [
    '_id',
    'firstName',
    'lastName',
    'email',
    'isActive',
    'isAdmin',
    'cars',
];
export const CAR_FIELDS = ['id', 'make', 'model', 'type', 'years'];
export const USER_CAR_FIELDS = [
    'make',
    'model',
    'type',
    'years',
    'regNumber',
    'carId',
    'id',
];
export const RESERVATION_FIELDS = [
    'id',
    'duration',
    'carId',
    'userId',
    'type',
];

/**
 * REST DTO shapes returned to clients. All identifiers are raw service ids
 * (no Relay global-id encoding).
 */
export interface CarDTO {
    id: string;
    carId?: string;
    make?: string;
    model?: string;
    type?: string;
    years?: number[];
    regNumber?: string;
}

export interface UserDTO {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    isActive?: boolean;
    isAdmin?: boolean;
    carsCount?: number;
    cars?: Array<CarDTO | null>;
}

export interface ReservationDTO {
    id: string;
    type?: string;
    start: string | null;
    end: string | null;
    car: CarDTO | null;
    user: Partial<UserDTO> | null;
}

/**
 * Extracts a bound (lower/upper) value out of a sequelize RANGE value, which
 * may come across the wire as a plain [lower, upper] tuple or as an array of
 * { value, inclusive } bound objects. Ported from the GraphQL gateway's
 * reservation entity.
 */
export function bound(range: any, index: number): string | null {
    const item = range && range[index];

    if (item && typeof item === 'object' && 'value' in item) {
        return item.value;
    }

    return item ?? null;
}

/**
 * Converts an array of objects to a map keyed by the given field.
 */
function toMap(arr: any[], field = 'id'): { [key: string]: any } {
    return (arr || []).reduce((map, item) => {
        if (item) {
            map[item[field]] = item;
        }

        return map;
    }, {});
}

/**
 * Resolves a user's car associations into full car DTOs by joining each user
 * car with its catalog record. Ports `toRequestedCarsList` from the GraphQL
 * gateway, using raw ids.
 */
export async function resolveUserCars(
    userCars: any[],
    context: Context,
): Promise<Array<CarDTO | null>> {
    if (!(userCars && userCars.length)) {
        return [];
    }

    const carIds = userCars.reduce((ids: string[], car) => {
        if (car && !ids.includes(car.carId)) {
            ids.push(car.carId);
        }

        return ids;
    }, []);

    const catalog = toMap(
        (await context.car.fetch(carIds, [...CAR_FIELDS])) as any[],
    );

    return userCars.map(userCar => {
        if (!catalog[userCar.carId]) {
            return null;
        }

        const merged: any = { ...catalog[userCar.carId], ...userCar };

        merged.id = userCar._id;
        delete merged._id;

        return merged as CarDTO;
    });
}

/**
 * Converts a raw user service object into a user DTO. Car associations are
 * resolved (joined with the catalog) only when `withCars` is requested;
 * `carsCount` is always derived from the embedded cars array when present.
 */
export async function toUserDTO(
    user: any,
    context: Context,
    withCars = false,
): Promise<UserDTO | null> {
    if (!user) {
        return null;
    }

    const dto: UserDTO = {
        id: user._id ? String(user._id) : undefined,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: !!user.isActive,
        isAdmin: !!user.isAdmin,
        carsCount: Array.isArray(user.cars) ? user.cars.length : 0,
    };

    if (withCars) {
        dto.cars = await resolveUserCars(user.cars || [], context);
    }

    return dto;
}

/**
 * Converts a catalog car service object into a car DTO (raw id).
 */
export function toCarDTO(car: any): CarDTO | null {
    if (!car) {
        return null;
    }

    return {
        id: String(car.id),
        make: car.make,
        model: car.model,
        type: car.type,
        years: car.years,
    };
}

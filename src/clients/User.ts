/*!
 * IMQ-RPC Service Client: User
 *
 * I'm Queue Software Project
 * Copyright (C) 2026  imqueue.com <support@imqueue.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * If you want to use this code in a closed source (commercial) project, you can
 * purchase a proprietary commercial license. Please contact us at
 * <support@imqueue.com> to get commercial licensing options.
 */
import {
    IMQClient,
    IMQDelay,
    IMQMetadata,
    remote,
    profile,
} from '@imqueue/rpc';

export namespace user {
    export interface UserCarObject {
        _id: string;
        carId: string;
        regNumber: string;
    }

    export interface UserObject {
        _id?: string;
        email: string;
        password: string;
        isActive: boolean;
        isAdmin: boolean;
        firstName: string;
        lastName: string;
        cars: UserCarObject[];
    }

    export interface UserFilters {
        email?: string;
        isActive?: boolean;
        isAdmin?: boolean;
        firstName?: string;
        lastName?: string;
    }

    export class UserClient extends IMQClient {
        /**
         * Returns current version of running service
         *
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<{ name: string, version: string, repository?: string }>}
         */
        @profile()
        @remote()
        public async version(
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<{ name: string; version: string; repository?: string }> {
            return await this.remoteCall<{
                name: string;
                version: string;
                repository?: string;
            }>(...arguments);
        }

        /**
         * Creates or updates existing user with the new data set
         *
         * @param {UserObject} data - user data fields
         * @param {string[]} [fields] - fields to return on success
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<UserObject | null>}
         */
        @profile()
        @remote()
        public async update(
            data: UserObject,
            fields?: string[],
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<UserObject | null> {
            return await this.remoteCall<UserObject | null>(...arguments);
        }

        /**
         * Returns number of cars registered for the user having given id or email
         *
         * @param {string} idOrEmail
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<number>}
         */
        @profile()
        @remote()
        public async carsCount(
            idOrEmail: string,
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<number> {
            return await this.remoteCall<number>(...arguments);
        }

        /**
         * Look-ups and returns user data by either user e-mail or by user object
         * identifier
         *
         * @param {string} criteria - user identifier or e-mail string
         * @param {string[]} [fields] - fields to select and return
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<UserObject | null>}
         */
        @profile()
        @remote()
        public async fetch(
            criteria: string,
            fields?: string[],
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<UserObject | null> {
            return await this.remoteCall<UserObject | null>(...arguments);
        }

        /**
         * Returns number of users stored in the system and matching given criteria
         *
         * @param {UserFilters} [filters] - filter by is active criteria
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<number>}
         */
        @profile()
        @remote()
        public async count(
            filters?: UserFilters,
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<number> {
            return await this.remoteCall<number>(...arguments);
        }

        /**
         * Returns collection of users matched is active criteria. Records
         * can be fetched skipping given number of records and having max length
         * of a given limit argument
         *
         * @param {UserFilters} [filters] - is active criteria to filter user list
         * @param {string[]} [fields] - list of fields to be selected and returned for each found user object
         * @param {number} [skip] - record to start fetching from
         * @param {number} [limit] - selected collection max length from a starting position
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<UserObject[]>}
         */
        @profile()
        @remote()
        public async find(
            filters?: UserFilters,
            fields?: string[],
            skip?: number,
            limit?: number,
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<UserObject[]> {
            return await this.remoteCall<UserObject[]>(...arguments);
        }

        /**
         * Attach new car to a user
         *
         * @param {string} userId - user identifier to add car to
         * @param {string} carId - selected car identifier
         * @param {string} regNumber - car registration number
         * @param {string[]} [selectedFields] - fields to fetch for a modified user object
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<UserObject | null>}
         */
        @profile()
        @remote()
        public async addCar(
            userId: string,
            carId: string,
            regNumber: string,
            selectedFields?: string[],
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<UserObject | null> {
            return await this.remoteCall<UserObject | null>(...arguments);
        }

        /**
         * Removes given car from a user
         *
         * @param {string} carId - user car identifier
         * @param {string[]} [selectedFields] - fields to fetch for a modified user object
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<UserObject | null>}
         */
        @profile()
        @remote()
        public async removeCar(
            carId: string,
            selectedFields?: string[],
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<UserObject | null> {
            return await this.remoteCall<UserObject | null>(...arguments);
        }

        /**
         * Returns car object of a given user, fetched by identifier
         *
         * @param {string} userId - user identifier
         * @param {string} carId - car identifier
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<UserCarObject | null>}
         */
        @profile()
        @remote()
        public async getCar(
            userId: string,
            carId: string,
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<UserCarObject | null> {
            return await this.remoteCall<UserCarObject | null>(...arguments);
        }
    }
}

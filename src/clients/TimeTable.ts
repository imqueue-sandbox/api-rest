/*!
 * IMQ-RPC Service Client: TimeTable
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

export namespace timeTable {
    export interface Reservation {
        id: number;
        carId: string;
        userId: string;
        type: 'fast' | 'std' | 'full';
        duration: [string, string];
    }

    export interface BaseTimeOption {
        key: string;
        title: string;
        duration: number;
    }

    export interface TimeTableOptions {
        start: string;
        end: string;
        boxes: number;
        baseTime: BaseTimeOption[];
    }

    export class TimeTableClient extends IMQClient {
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
         * Returns a list of reservations for a given date (or the current date if
         * omitted)
         *
         * @param {string} [date] - date to select reservations for
         * @param {string[]} [fields] - fields to select for each reservation
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<Reservation[]>}
         */
        @profile()
        @remote()
        public async list(
            date?: string,
            fields?: string[],
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<Reservation[]> {
            return await this.remoteCall<Reservation[]>(...arguments);
        }

        /**
         * Fetches and returns a single reservation record by its identifier
         *
         * @param {string} id - reservation identifier to fetch
         * @param {string[]} [fields] - fields to select for the reservation
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<Partial<Reservation> | null>}
         */
        @profile()
        @remote()
        public async fetch(
            id: string,
            fields?: string[],
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<Partial<Reservation> | null> {
            return await this.remoteCall<Partial<Reservation> | null>(
                ...arguments,
            );
        }

        /**
         * Makes a given reservation or throws a proper error if it is not possible
         *
         * @param {Reservation} reservation - reservation data structure
         * @param {string[]} [fields] - fields to select for the updated reservations list
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<Reservation[]>}
         */
        @profile()
        @remote()
        public async reserve(
            reservation: Reservation,
            fields?: string[],
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<Reservation[]> {
            return await this.remoteCall<Reservation[]>(...arguments);
        }

        /**
         * Cancels a reservation at a given time
         *
         * @param {string} id - reservation identifier
         * @param {string[]} [fields] - fields to select for the updated reservations list
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<Reservation[]>}
         */
        @profile()
        @remote()
        public async cancel(
            id: string,
            fields?: string[],
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<Reservation[]> {
            return await this.remoteCall<Reservation[]>(...arguments);
        }

        /**
         * Returns reservation time-table configuration settings
         *
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<TimeTableOptions>}
         */
        @profile()
        @remote()
        public async config(
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<TimeTableOptions> {
            return await this.remoteCall<TimeTableOptions>(...arguments);
        }
    }
}

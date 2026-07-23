/*!
 * IMQ-RPC Service Client: Car
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

export namespace car {
    export interface CarObject {
        id: string;
        make: string;
        model: string;
        type: string;
        years: number[];
    }

    export class CarClient extends IMQClient {
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
         * Returns a list of car manufacturers (car brands)
         *
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<string[]>}
         */
        @profile()
        @remote()
        public async brands(
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<string[]> {
            return await this.remoteCall<string[]>(...arguments);
        }

        /**
         * Returns car object by its identifier or, if multiple identifiers given
         * as array of identifiers, returns a list of car objects.
         *
         * @param {string | string[]} id - car identifier(s)
         * @param {string[]} [selectedFields] - fields to return
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<Partial<CarObject> | Partial<CarObject | null>[] | null>}
         */
        @profile()
        @remote()
        public async fetch(
            id: string | string[],
            selectedFields?: string[],
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<Partial<CarObject> | Partial<CarObject | null>[] | null> {
            return await this.remoteCall<
                Partial<CarObject> | Partial<CarObject | null>[] | null
            >(...arguments);
        }

        /**
         * Returns list of known cars for a given brand
         *
         * @param {string} brand - car manufacturer (brand) name
         * @param {string[]} [selectedFields] - fields to return
         * @param {string} [sort] - sort field, by default is 'model'
         * @param {'asc' | 'desc'} [dir] - sort direction, by default is 'asc' (ascending)
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<Partial<CarObject>[]>}
         */
        @profile()
        @remote()
        public async list(
            brand: string,
            selectedFields?: string[],
            sort?: string,
            dir?: 'asc' | 'desc',
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<Partial<CarObject>[]> {
            return await this.remoteCall<Partial<CarObject>[]>(...arguments);
        }
    }
}

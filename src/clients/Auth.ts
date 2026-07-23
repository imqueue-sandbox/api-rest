/*!
 * IMQ-RPC Service Client: Auth
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

export namespace auth {
    export class AuthClient extends IMQClient {
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
         * Logs user in
         *
         * @param {string} email - user email address
         * @param {string} password - user plain-text password
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<string | null>}
         */
        @profile()
        @remote()
        public async login(
            email: string,
            password: string,
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<string | null> {
            return await this.remoteCall<string | null>(...arguments);
        }

        /**
         * Logs user out
         *
         * @param {string} token - jwt auth user token
         * @param {string} [verifyEmail] - email to verify from a given token (if provided - must match)
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<boolean>}
         */
        @profile()
        @remote()
        public async logout(
            token: string,
            verifyEmail?: string,
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<boolean> {
            return await this.remoteCall<boolean>(...arguments);
        }

        /**
         * Verifies if user token is valid, and if so - returns an associated user
         * object
         *
         * @param {string} token - the user auth token to verify
         * @param {IMQMetadata} [imqMetadata] - if passed, will deliver given metadata to service, and will initiate trace handler calls
         * @param {IMQDelay} [imqDelay] - if passed the method will be called with the specified delay over message queue
         * @return {Promise<object | null>}
         */
        @profile()
        @remote()
        public async verify(
            token: string,
            imqMetadata?: IMQMetadata,
            imqDelay?: IMQDelay,
        ): Promise<object | null> {
            return await this.remoteCall<object | null>(...arguments);
        }
    }
}

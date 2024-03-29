/*
 *     Copyright 2011-2020 Couchbase, Inc.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import { OutputChannel, window } from "vscode";
import { Level } from "./enum";
import { Constants } from "../util/constants";

class Logger {
    private outputChannel: OutputChannel;

    constructor() {
        this.outputChannel = window.createOutputChannel(`${Constants.extensionID}`);
    }

    debug(msg: any) {
        this.log(`${this.toString(msg)}`, Level.debug);
    }

    info(msg: any) {
        this.log(`${this.toString(msg)}`, Level.info);
    }

    warn(msg: any) {
        this.log(`${this.toString(msg)}`, Level.warn);
    }

    error(msg: any) {
        this.log(`${this.toString(msg)}`, Level.error);
    }

    output(msg: any) {
        this.outputChannel.appendLine(this.toString(msg));
    }

    showOutput() {
        this.outputChannel.show();
    }

    private toString(msg: any): string {
        return msg.toString();
    }

    private log(msg: string, level: Level) {
        const time = new Date().toLocaleString();
        msg = `[${time}][${Constants.extensionID}][${level}] ${msg}`;
        this.output(msg);
    }
}

export const logger: Logger = new Logger();
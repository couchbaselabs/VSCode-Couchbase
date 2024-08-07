/**
 * Copyright 2011-2021 Couchbase, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as path from "path";
import Mocha from "mocha";
import util from 'util';
const glob = util.promisify(require('glob'));

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise(async (c, e) => {
    const testFile = process.env.VSCODE_TEST_FILE;

    if (testFile) {
      // If a specific test file is specified, only add that file
      mocha.addFile(path.resolve(testsRoot, testFile));
    } else {
    try {
      const files = await glob("contributor/*.test.js", { cwd: testsRoot });
      files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));
  } catch (err) {
      console.error("Error during glob operation:", err);
      return;
  }
  }
      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err: any) {
        console.error(err);
        e(err);
      }
    });
}

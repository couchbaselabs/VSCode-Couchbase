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
import * as vscode from "vscode";
import { IConnection } from "../../types/IConnection";
import { Memory } from "../../util/util";
import { logger } from "../../logger/logger";
import { CollectionDirectory } from "../../model/CollectionDirectory";

export const createCollection = async (node: CollectionDirectory) => {
    const connection = Memory.state.get<IConnection>("activeConnection");
    if (!connection) {
        return;
    }

    const collectionName = await vscode.window.showInputBox({
        prompt: "Collection name",
        placeHolder: "collection name",
        ignoreFocusOut: true,
        value: "",
    });
    if (!collectionName) {
        vscode.window.showErrorMessage("Collection name is required.");
        return;
    }
    if (collectionName.startsWith('%') || collectionName.startsWith('_')) {
        vscode.window.showErrorMessage(`Collection names cannot start with ${collectionName[0]}`);
        return;
    }

    const collectionManager = await node.connection.cluster
        ?.bucket(node.bucketName)
        .collections();
    await collectionManager?.createCollection({
        name: collectionName,
        scopeName: node.scopeName,
    });

    logger.info(`${node.bucketName}: ${node.scopeName}: Successfully created the collection: ${collectionName}`);
};

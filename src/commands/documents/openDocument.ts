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
import DocumentNode from "../../model/DocumentNode";
import { DocumentNotFoundError } from "couchbase/dist/errors";
import { logger } from "../../logger/logger";
import { MemFS } from "../../util/fileSystemProvider";
import ClusterConnectionTreeProvider from "../../tree/ClusterConnectionTreeProvider";

export const openDocument = async (documentNode: DocumentNode, clusterConnectionTreeProvider: ClusterConnectionTreeProvider, uriToCasMap: Map<string, string>, memFs: MemFS) => {
    try {
        const result = await documentNode.connection.cluster
          ?.bucket(documentNode.bucketName)
          .scope(documentNode.scopeName)
          .collection(documentNode.collectionName)
          .get(documentNode.documentName);
        const uri = vscode.Uri.parse(
          `couchbase:/${documentNode.bucketName}/${documentNode.scopeName}/Collections/${documentNode.collectionName}/${documentNode.documentName}.json`
        );
        if (result) {
          uriToCasMap.set(uri.toString(), result.cas.toString());
        }
        memFs.writeFile(
          uri,
          Buffer.from(JSON.stringify(result?.content, null, 2)),
          { create: true, overwrite: true }
        );
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document, { preview: false });
        return true;
      } catch (err: any) {
        if (err instanceof vscode.FileSystemError && err.name === 'EntryNotFound (FileSystemError)' || err instanceof DocumentNotFoundError) {
          clusterConnectionTreeProvider.refresh();
        }
        logger.error("Failed to open Document");
        logger.debug(err);
      }
};
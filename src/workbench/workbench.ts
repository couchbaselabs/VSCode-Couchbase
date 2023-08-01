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

import * as vscode from 'vscode';
import * as path from 'path';
import { logger } from '../logger/logger';
import { ClusterConnectionNode } from '../model/ClusterConnectionNode';
import { getWebviewContent } from '../webViews/workbench.webview';
import { getActiveConnection } from '../util/connections';

export function openWorkbench(node: ClusterConnectionNode, context: vscode.ExtensionContext, currentPanel: vscode.WebviewPanel | undefined) {
    const connection = getActiveConnection();
    if (!connection) {
        vscode.window.showInformationMessage("Connection not established successfully!");
        return false;
    }
    try {
        if (currentPanel && currentPanel.viewType === 'Workbench') {
            const reactAppPathOnDisk = vscode.Uri.file(
                path.join(context.extensionPath, "dist", "reactBuild.js")
            );
            const reactAppUri = currentPanel.webview.asWebviewUri(reactAppPathOnDisk);
            currentPanel.webview.html = getWebviewContent(reactAppUri, context);
            currentPanel.reveal(vscode.ViewColumn.One);
        } else {
            currentPanel = vscode.window.createWebviewPanel(
                'Workbench',
                'New Workbench',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, "dist"))
                    ]
                }

            );
            const reactAppPathOnDisk = vscode.Uri.file(
                path.join(context.extensionPath, "dist", "reactBuild.js")
            );
            const reactAppUri = currentPanel.webview.asWebviewUri(reactAppPathOnDisk);

            currentPanel.webview.onDidReceiveMessage(async (message: any) => {
                switch (message.command) {
                    case "runQuery": {
                        const answer = await connection.cluster?.query(message.query);
                        currentPanel?.webview.postMessage({ command: "queryResult", result: answer });
                    }
                }
            })
            currentPanel.webview.html = getWebviewContent(reactAppUri, context);

            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                },
                undefined,
                context.subscriptions
            );
        }
    } catch (err) {
        logger.error("Failed to open Query Workbench");
        logger.debug(err);
    }
}
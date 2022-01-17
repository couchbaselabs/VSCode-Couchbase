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
import * as path from "path";
import { IConnection } from "./IConnection";
import { INode } from "./INode";
import { ScopeNode } from "./ScopeNode";
import { ScopeSpec } from "couchbase";

export class BucketNode implements INode {
  constructor(
    private readonly connection: IConnection,
    private readonly bucket: string,
    private readonly isScopesandCollections: boolean,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    vscode.workspace.fs.createDirectory(vscode.Uri.parse(`couchbase:/${bucket}`));
  }

  public getTreeItem(): vscode.TreeItem {
    return {
      label: `${this.bucket}`,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      contextValue: "database",
      iconPath: {
        light: path.join(__filename, "..", "..", "images/light", "bucket-icon.svg"),
        dark: path.join(__filename, "..", "..", "images/dark", "bucket-icon.svg"),
      } 
    };
  }

  public async getChildren(): Promise<INode[]> {
    const nodes: INode[] = [];
    if (this.isScopesandCollections) {
      try {
        let scopes = await this.connection.cluster?.bucket(this.bucket).collections().getAllScopes();
        scopes?.forEach((scope: ScopeSpec) => {
          nodes.push(new ScopeNode(
            this.connection,
            scope.name,
            this.bucket,
            scope.collections,
            vscode.TreeItemCollapsibleState.None
          ))
        });
      } catch (err: any) {
        console.log(err);
        throw new Error(err);
      }
    }

    // TODO: support non scope/collection docs?
    return nodes;
  }
}

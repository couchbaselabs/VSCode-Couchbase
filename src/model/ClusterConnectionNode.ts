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

import { IConnection } from "../types/IConnection";
import { INode } from "../types/INode";
import { BucketNode } from "./BucketNode";
import { BucketSettings } from "couchbase";
import { getActiveConnection } from "../util/connections";
import InformationNode from "./InformationNode";
import { logger } from "../logger/logger";
import { CacheService } from "../../src/util/cacheService/cacheService"
import { Constants } from "../util/constants";

export class ClusterConnectionNode implements INode {
  constructor(
    public readonly id: string,
    public readonly connection: IConnection,
    public cacheService: CacheService
  ) {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  public isActive: Boolean = false;

  private _onDidChangeTreeData: vscode.EventEmitter<any>;
  public readonly onDidChangeTreeData: vscode.Event<any>;

  public getTreeItem(): vscode.TreeItem {
    const activeConnection = getActiveConnection();
    this.isActive = `${this.connection.username}@${this.connection.url}` === `${activeConnection?.username}@${activeConnection?.url}`;

    return {
      label: this.isActive ? `${this.id}` : this.id,
      collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      contextValue: this.isActive ? "active_connection" : "connection",
      iconPath: {
        light: path.join(__filename, "..", "..", "images", this.isActive ? "" : "light", "cb-logo-icon.svg"),
        dark: path.join(__filename, "..", "..", "images", this.isActive ? "" : "dark", "cb-logo-icon.svg"),
      },
    };
  }

  public async getChildren(): Promise<INode[]> {
    const nodes: INode[] = [];
    if (!this.isActive) {
      return nodes;
    }
    // only support CB 7.0 for now
    let isScopesandCollections = true;
    try {
      const activeConnection = getActiveConnection();
      if (!activeConnection) {
        return nodes;
      }
      let buckets = await activeConnection.cluster?.buckets().getAllBuckets();
      buckets?.forEach((bucket: BucketSettings) => {
        nodes.push(
          new BucketNode(
            this,
            bucket.name,
            isScopesandCollections,
            vscode.TreeItemCollapsibleState.None,
            this.cacheService
          )
        );
      });
      this.cacheService.refreshCacheOnTimeout(Constants.BUCKET_CACHE_EXPIRY_DURATION, Constants.COLLECTION_CACHE_EXPIRY_DURATION, false);
    } catch (err: any) {
      logger.error("Failed to load Buckets");
      logger.debug(err);
      throw new Error(err);
    }
    if (nodes.length === 0) {
      nodes.push(new InformationNode("No buckets found"));
    }
    return nodes;
  }
}

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
import DocumentNode from "./DocumentNode";
import { PagerNode } from "./PagerNode";
import { abbreviateCount, hasQueryService } from "../util/common";
import { ParsingFailureError, PlanningFailureError } from "couchbase";
import InformationNode from "./InformationNode";
import { Memory } from "../util/util";
import { IFilterDocuments } from "../types/IFilterDocuments";
import { SchemaDirectory } from "./SchemaDirectory";
import { getActiveConnection } from "../util/connections";
import { Commands } from "../commands/extensionCommands/commands";
import { IndexDirectory } from "./IndexDirectory";
import { logger } from "../logger/logger";
import { CouchbaseRestAPI } from "../util/apis/CouchbaseRestAPI";
import { CacheService } from "../../src/util/cacheService/cacheService"
import { Constants } from "../util/constants";


export default class CollectionNode implements INode {
  constructor(
    public readonly parentNode: INode,
    public readonly connection: IConnection,
    public readonly scopeName: string,
    public readonly documentCount: number,
    public readonly bucketName: string,
    public readonly collectionName: string,
    public readonly filter: boolean,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public cacheService: CacheService,
    public limit: number = 10,
  ) {
    vscode.workspace.fs.createDirectory(
      vscode.Uri.parse(
        `couchbase:/${bucketName}/${scopeName}/Collections/${collectionName}`
      )
    );
  }

  public async getIndexedField(): Promise<string | null> {
    const idxs = await this.connection?.cluster?.queryIndexes().getAllIndexes(this.bucketName, { scopeName: this.scopeName, collectionName: this.collectionName });
    let filter: string | null = null;
    if (!idxs) {
      return null;
    }

    for (const idx of idxs) {
      if (idx.isPrimary) {
        return "meta().id";
      } else {
        const result = this.getValidIndexKey(idx.indexKey);
        if (result) {
          if (!idx.condition && result[1]) {
            return result[0];
          } else {
            filter = result[0];
          }
        }
      }
    }

    return filter;
  }

  private getValidIndexKey(array: any[]): [string, boolean] | null {
    for (let i = 0; i < array.length; i++) {
      let key: string = array[i];
      if (!key.includes("(")) {
        if (key.endsWith(" DESC") || key.endsWith(" ASC")) {
          key = key.replace(" ASC", "").replace(" DESC", "").trim();
        }
        key = key.replace(/`/g, "");

        return [key, i === 0];
      }
    }
    return null;
  }

  public async getTreeItem(): Promise<vscode.TreeItem> {
    return {
      label: `${this.collectionName} (${abbreviateCount(this.documentCount)})`,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      contextValue:
        (this.collectionName === "_default"
          ? "default_collection"
          : "collection") + (this.filter ? "_filter" : ""),
      iconPath: {
        light: path.join(
          __filename,
          "..",
          "..",
          "images/light",
          this.filter ? "filter.svg" : "documents-icon.svg"
        ),
        dark: path.join(
          __filename,
          "..",
          "..",
          "images/dark",
          this.filter ? "filter.svg" : "documents-icon.svg"
        ),
      },
    };
  }

  public async getChildren(): Promise<INode[]> {
    let documentList: INode[] = [];
    // Index directory to contains list of indexes
    const indexItem = new IndexDirectory(
      this,
      this.connection,
      "Indexes",
      this.bucketName,
      this.scopeName,
      this.collectionName,
      [],
      vscode.TreeItemCollapsibleState.None,
      this.cacheService
    );
    const connection = getActiveConnection();
    if (!connection) {
      return [];
    }
    const isQueryServicesEnable = hasQueryService(connection?.services);
    if (isQueryServicesEnable) {
      this.cacheService.refreshCacheOnTimeout(Constants.BUCKET_CACHE_EXPIRY_DURATION, Constants.COLLECTION_CACHE_EXPIRY_DURATION, false);
      documentList.push(indexItem);
      documentList.push(
        new SchemaDirectory(
          this,
          this.connection,
          "Schema",
          this.bucketName,
          this.scopeName,
          this.collectionName,
          this.cacheService
        )
      );
    }
    // TODO: default limit could be managed as user settings / preference
    let result;
    // An index is required for database querying. If one is present, a result will be obtained.
    // If not, the user will be prompted to create a index before querying.
    let docFilter = Memory.state.get<IFilterDocuments>(
      `filterDocuments-${this.connection.connectionIdentifier}-${this.bucketName}-${this.scopeName}-${this.collectionName}`
    );
    let filter: string = "";
    if (docFilter && docFilter.filter.length > 0) {
      filter = docFilter.filter;
    }
    const couchbbaseRestAPI = new CouchbaseRestAPI(connection);
    if (!hasQueryService(connection?.services!)) {
      result = await couchbbaseRestAPI.getKVDocuments(this.bucketName, this.scopeName, this.collectionName, 0, this.limit);
      result.rows = result.rows.map((item: any) => item.id);
    }
    else {
      try {
        // selects the attribute that needs to be used according to the index
        const idxField = await this.getIndexedField();
        if (idxField === null) {
          throw new PlanningFailureError();
        }
        result = await connection?.cluster?.query(
          `SELECT RAW META().id FROM \`${this.bucketName}\`.\`${this.scopeName}\`.\`${this.collectionName}\` ${'WHERE ' + idxField + ' IS NOT MISSING'} ${filter.length > 0 ? "AND  " + filter : ""
          } LIMIT ${this.limit}`
        );
      } catch (err) {
        if (err instanceof PlanningFailureError) {
          const infoNode: InformationNode = new InformationNode(
            "No indexes available, click to create one",
            "No indexes available to list the documents in this collection",
            {
              command: Commands.checkAndCreatePrimaryIndex,
              title: "Create Primary Index",
              arguments: [this],
            }
          );
          documentList.push(infoNode);
          result = await couchbbaseRestAPI.getKVDocuments(this.bucketName, this.scopeName, this.collectionName, 0, this.limit);
          result.rows = result.rows.map((item: any) => item.id);
        } else if (err instanceof ParsingFailureError) {
          logger.error(`In Collection Node: ${this.collectionName}: Parsing Failed: Incorrect filter definition`);
        }
      }
    }
    result?.rows.forEach((documentName: string) => {
      const documentTreeItem = new DocumentNode(
        this,
        documentName,
        this.connection,
        this.scopeName,
        this.bucketName,
        this.collectionName,
        true,
        vscode.TreeItemCollapsibleState.None
      );
      documentList.push(documentTreeItem);
    });
    // TODO: add local only (un-synchronized) files to documentList

    // Checking document list length with 2 as Schema and index Directory are always present
    if (((!isQueryServicesEnable && documentList.length === 0)) || (isQueryServicesEnable && documentList.length === 2)) {
      documentList.push(new InformationNode("No Documents found"));
    } else if (this.documentCount > documentList.length) {
      documentList.push(new PagerNode(this));
    }
    return documentList;
  }
}
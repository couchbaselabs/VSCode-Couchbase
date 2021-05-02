import * as vscode from 'vscode';
import { IConnection } from './IConnection';
import { INode } from './INode';
import { ENDPOINTS } from '../util/endpoints';
import get from "axios";
import { AxiosRequestConfig } from "axios";
import DocumentNode from './DocumentNode';

export default class CollectionNode implements INode{
    constructor(
        private readonly connection: IConnection,
        private readonly scopeName: string,
        private readonly documents: any,
        private readonly bucketName: string,
        private readonly collectionName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
      ) {}

      public async getTreeItem(): Promise<vscode.TreeItem> {
        return {
              label: `Collection:${this.collectionName} (${this.documents.rows.length})`,
              collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
          };
    }

    public async getChildren(): Promise<INode[]> {
    let documentList: DocumentNode[] = [];
    this.documents.rows.forEach((document: any) => {
      const documentTreeItem = new DocumentNode(
        document.id,
        this.connection,
        this.scopeName,
        this.bucketName,
        this.collectionName,
        vscode.TreeItemCollapsibleState.None
      );
      documentList.push(documentTreeItem);
    });
    return documentList;
  }
}
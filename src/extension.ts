/*
 *     Copyright 2011-2023 Couchbase, Inc.
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
import { BucketNode } from "./model/BucketNode";
import { ClusterConnectionNode } from "./model/ClusterConnectionNode";
import CollectionNode from "./model/CollectionNode";
import DocumentNode from "./model/DocumentNode";
import { IConnection } from "./types/IConnection";
import { INode } from "./types/INode";
import { logger } from "./logger/logger";
import { PagerNode } from "./model/PagerNode";
import { ScopeNode } from "./model/ScopeNode";
import ClusterConnectionTreeProvider from "./tree/ClusterConnectionTreeProvider";
import {
  addConnection,
  removeConnection,
  setActiveConnection,
  useConnection,
} from "./util/connections";
import { MemFS } from "./util/fileSystemProvider";
import { Global, Memory, WorkSpace } from "./util/util";
import { QueryContentSerializer } from "./notebook/serializer";
import { QueryKernel } from "./notebook/controller";
import { Constants } from "./util/constants";
import { createNotebook } from "./notebook/notebook";
import IndexNode from "./model/IndexNode";
import { IndexDirectory } from "./model/IndexDirectory";
import { openIndexInfo } from "./commands/indexes/openIndexInformation";
import { Commands } from "./commands/extensionCommands/commands";
import { createDocument, removeDocument, searchDocument, getDocumentMetaData, openDocument } from "./commands/documents";
import { getSampleProjects } from "./commands/sampleProjects/getSampleProjects";
import { createCollection, removeCollection } from "./commands/collections";
import { createScope, removeScope } from "./commands/scopes";
import { getBucketMetaData } from "./commands/buckets/getBucketMetaData";
import { handleOnSaveTextDocument } from "./handlers/handleSaveDocument";
import { handleActiveEditorChange } from "./handlers/handleActiveTextEditorChange";
import { QueryWorkbench } from "./workbench/queryWorkbench";
import { WorkbenchWebviewProvider } from "./workbench/workbenchWebviewProvider";
import { fetchClusterOverview } from "./pages/overviewCluster/overviewCluster";
import DependenciesDownloader from "./handlers/handleCLIDownloader";
import { sqlppFormatter } from "./commands/sqlpp/sqlppFormatter";
import { fetchQueryContext, fetchSearchContext } from "./pages/queryContext/queryContext";
import { fetchFavoriteQueries } from "./pages/FavoriteQueries/FavoriteQueries";
import { markFavoriteQuery } from "./commands/favoriteQueries/markFavoriteQuery";
import { QueryHistoryTreeProvider } from "./tree/QueryHistoryTreeProvider";
import { deleteQueryItem } from "./commands/queryHistory/deleteQuery";
import { copyQuery } from "./commands/queryHistory/copyQuery";
import { applyQuery } from "./commands/queryHistory/applyQuery";
import { handleQueryContextStatusbar } from "./handlers/handleQueryContextStatusbar";
import { queryTypeFilterDocuments } from "./commands/documents/documentFilters/queryTypeFilterDocuments";
import { clearDocumentFilter } from "./commands/documents/documentFilters/clearDocumentFilter";
import { getClusterOverviewData } from "./util/OverviewClusterUtils/getOverviewClusterData";
import { checkAndCreatePrimaryIndex } from "./commands/indexes/checkAndCreatePrimaryIndex";
import { dataExport } from "./pages/Tools/DataExport/dataExport";
import { mdbMigrate } from "./pages/Tools/MdbMigrate/mdbMigrate";
import { DataImport } from "./commands/tools/dataImport";
import { ddlExport } from "./commands/tools/ddlExport/ddlExport";
import { CouchbaseIqWebviewProvider } from "./commands/iq/couchbaseIqWebviewProvider";
import { iqLogoutHandler } from "./commands/iq/iqLogoutHandler";
import { CacheService } from "./util/cacheService/cacheService";
import { secretUpdater } from "./util/secretUpdater";
import { newChatHandler } from "./commands/iq/chat/newChatHandler";
import { SecretService } from "./util/secretService";
import { kvTypeFilterDocuments } from "./commands/documents/documentFilters/kvTypeFilterDocuments";
import { fetchNamedParameters } from "./pages/namedParameters/namedParameters";
import { sqlppComlpletions, sqlppNamedParametersCompletions, sqlppSchemaComlpletions } from "./commands/sqlpp/sqlppCompletions";
import { dynamodbMigrate } from "./pages/Tools/DynamoDbMigrate/dynamoDbMigrate";
import { SearchWorkbench } from "./commands/fts/SearchWorkbench/searchWorkbench";
import SearchIndexNode from "./model/SearchIndexNode";
import { openSearchIndex } from "./commands/fts/SearchWorkbench/openSearchIndex";
import { handleSearchContextStatusbar } from "./handlers/handleSearchQueryContextStatusBar";
import { validateDocument } from "./commands/fts/SearchWorkbench/validators/validationUtil";
import { AutocompleteVisitor } from "./commands/fts/SearchWorkbench/contributor/autoCompleteVisitor";
import { CbsJsonHoverProvider } from "./commands/fts/SearchWorkbench/documentation/documentationProvider";
import { deleteIndex } from "./util/ftsIndexUtils";
import { JsonAttributeCompletionProvider } from "./commands/documents/contributor/autoCompleteContributor";

export function activate(context: vscode.ExtensionContext) {
  Global.setState(context.globalState);
  WorkSpace.setState(context.workspaceState);
  Memory.setState();
  Memory.state.update(
    "vscode-couchbase",
    vscode.workspace.getConfiguration("vscode-couchbase")
  );
  logger.info(`Activating extension ${Constants.extensionID} v${Constants.extensionVersion}`);

  const cliDownloader = new DependenciesDownloader();
  cliDownloader.handleCLIDownloader();

  const uriToCasMap = new Map<string, string>();
  const workbench = new QueryWorkbench();
  const searchWorkbench = new SearchWorkbench();

  let currentSearchIndexNode: SearchIndexNode;
  let currentSearchWorkbench: SearchWorkbench;

  let diagnosticCollection = vscode.languages.createDiagnosticCollection('jsonValidation');

  diagnosticCollection = vscode.languages.createDiagnosticCollection('jsonValidation');
  context.subscriptions.push(diagnosticCollection);

context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document === vscode.window.activeTextEditor?.document && event.document.languageId == "json" && vscode.window.activeTextEditor?.document.fileName.endsWith(".cbs.json")) {
        validateDocument(event.document, diagnosticCollection);
    }
}));

const hoverProvider = new CbsJsonHoverProvider(context);
context.subscriptions.push(
    vscode.languages.registerHoverProvider({ language: 'json', pattern: '**/*.cbs.json' }, hoverProvider)
);

const provider = vscode.languages.registerCompletionItemProvider(
  { language: 'json', pattern: '**/*.cbs.json' },
  {
      async provideCompletionItems(document, position, token, context) {
          const autoComplete = new AutocompleteVisitor();
          const suggestions = await autoComplete.getAutoCompleteContributor(document, position, currentSearchWorkbench, cacheService);
          if (suggestions.length === 0) {
            return [new vscode.CompletionItem('', vscode.CompletionItemKind.Text)].map(item => {
                item.sortText = '\u0000';
                item.preselect = true;
                item.keepWhitespace = true;
                item.insertText = '';
                item.range = new vscode.Range(position, position);
                return item;
            });
        }
          return suggestions;
      }
  },
  '\"' 
);



context.subscriptions.push(provider);

const autoCompleteProviderForDocuments = vscode.languages.registerCompletionItemProvider(
  { language: 'json' },
  {
      async provideCompletionItems(document, position, token, context) {
          const autoComplete = new JsonAttributeCompletionProvider(document,cacheService);
          const suggestions = await autoComplete.provideCompletionItems(document,position);
          if (suggestions?.length === 0) {
            return [new vscode.CompletionItem('', vscode.CompletionItemKind.Text)].map(item => {
                item.sortText = '\u0000';
                item.preselect = true;
                item.keepWhitespace = true;
                item.insertText = '';
                item.range = new vscode.Range(position, position);
                return item;
            });
        }
          return suggestions;
      }
  },
  '\"' 
);



context.subscriptions.push(autoCompleteProviderForDocuments);

const disposable = vscode.window.onDidChangeTextEditorSelection(async (e) => {
  if (e.kind === vscode.TextEditorSelectionChangeKind.Command) {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.fileName.endsWith('.cbs.json')) {
          await vscode.commands.executeCommand('editor.action.formatDocument');
      }
  }
});

context.subscriptions.push(disposable);


  const subscriptions = context.subscriptions;
  const cacheService = new CacheService();
  const clusterConnectionTreeProvider = new ClusterConnectionTreeProvider(
    context,
    cacheService
  );

  // Update secret service with context at startup of extension.
  const secretService = SecretService.getInstance(context);

  // Function to update secrets, before building, update this file
  secretUpdater(context);

  // Set up the global error handler
  process.on('uncaughtException', (error) => {
    logger.error(`Unhandled error: ${error.message}`);
  });
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(reason instanceof Error ? `${reason.message}` : reason);
  });

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.showOutputConsole,
      () => {
        logger.showOutput();
      }
    )
  );

  const workbenchWebviewProvider = new WorkbenchWebviewProvider(context);
  subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      Commands.queryWorkbench,
      workbenchWebviewProvider
    )
  );

  const couchbaseIqWebviewProvider = new CouchbaseIqWebviewProvider(context, cacheService);
  subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      Commands.couchbaseIqViewsCommand,
      couchbaseIqWebviewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.logoutIq,
      () => {
        iqLogoutHandler();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.newIqChat,
      () => {
        newChatHandler();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.showIqSettings,
      () => {
        vscode.commands.executeCommand('workbench.action.openSettings', "couchbase.iq");
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.showWorkbenchSettings,
      () => {
        vscode.commands.executeCommand('workbench.action.openSettings', "couchbase.workbench");
      }
    )
  );

  subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (
        editor &&
        editor.document.languageId === "json" &&
        editor.document.uri.scheme === "couchbase" &&
        !editor.document.uri.path.endsWith("cbs.json") &&
        !editor.document.uri.path.includes("/Search/")
      ) {
        await handleActiveEditorChange(editor, uriToCasMap, memFs);
      }
    })
  );

  subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(
      async (document: vscode.TextDocument) => {
        if (
          document && document.languageId === "json" &&
          document.uri.scheme === "couchbase" && 
          !document.uri.path.endsWith("cbs.json") &&
          !document.uri.path.includes("/Search/")
        ) {
          await handleOnSaveTextDocument(document, uriToCasMap, memFs, cacheService);
          clusterConnectionTreeProvider.refresh();
        }
      }
    )
  );

  const memFs = new MemFS();
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider("couchbase", memFs, {
      isCaseSensitive: true,
    })
  );


  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.createClusterConnection,
      async () => {
        await addConnection(clusterConnectionTreeProvider, context);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.deleteClusterConnection,
      async (node: ClusterConnectionNode) => {
        if (node.isActive) {
          node.connection.cluster = undefined;
          setActiveConnection();
        }
        await removeConnection(node.connection);
        clusterConnectionTreeProvider.refresh();
        logger.info(`Connection named ${node.connection.connectionIdentifier} has been deleted.`);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.refreshCache,
      async (node: ClusterConnectionNode) => {
        await cacheService.clearAndRefreshCache(node.connection, true);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.refreshConnection,
      (node: INode) => {
        clusterConnectionTreeProvider.refresh(node);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.useClusterConnection,
      async (node: ClusterConnectionNode) => {
        await useConnection(node.connection);
        clusterConnectionTreeProvider.refresh();
        getClusterOverviewData();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.disconnectClusterConnection,
      async (node: ClusterConnectionNode) => {
        if (!node.isActive) {
          return;
        }
        node.connection.cluster = undefined;
        setActiveConnection();
        clusterConnectionTreeProvider.refresh(node);
        logger.info(`Connection to ${node.connection.connectionIdentifier} has been disconnection`);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.openDocument,
      async (documentNode: DocumentNode) => {
        await openDocument(documentNode, clusterConnectionTreeProvider, uriToCasMap, memFs);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.openSearchIndex,
      async (searchIndexNode: SearchIndexNode) => {
        await openSearchIndex(searchIndexNode, clusterConnectionTreeProvider, uriToCasMap, memFs);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.deleteSearchIndex,
      async (searchIndexNode: SearchIndexNode) => {
        await deleteIndex(searchIndexNode);
        clusterConnectionTreeProvider.refresh();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.openIndexInfo,
      async (indexNode: IndexNode) => {
        openIndexInfo(indexNode, memFs);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.loadMore,
      async (node: PagerNode) => {
        node.collection.limit += 10;
        clusterConnectionTreeProvider.refresh(node.collection);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.createDocument,
      async (node: CollectionNode) => {
        await createDocument(node, memFs, uriToCasMap);
        clusterConnectionTreeProvider.refresh(node);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.removeDocument,
      async (node: DocumentNode) => {
        await removeDocument(node, uriToCasMap, memFs, cacheService);
        clusterConnectionTreeProvider.refresh();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.refreshCollection,
      async (node: CollectionNode) => {
        const connection = Memory.state.get<IConnection>(Constants.ACTIVE_CONNECTION);
        if (!connection) {
          return;
        }

        clusterConnectionTreeProvider.refresh(node);
        // Force refresh cache of particular collection 
        await cacheService.updateCollectionSchemaAndIndexCache(connection, node.bucketName, node.scopeName, node.collectionName, Constants.COLLECTION_CACHE_EXPIRY_DURATION, true);

      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.createScope,
      async (node: BucketNode) => {
        await createScope(node);
        clusterConnectionTreeProvider.refresh(node);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.removeScope,
      async (node: ScopeNode) => {
        await removeScope(node);
        clusterConnectionTreeProvider.refresh();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.refreshScopes,
      async (node: BucketNode) => {
        clusterConnectionTreeProvider.refresh(node);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.createCollection,
      async (node: ScopeNode) => {
        await createCollection(node);
        clusterConnectionTreeProvider.refresh();
        await cacheService.updateBucketCache(node.bucketName, true);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.removeCollection,
      async (node: CollectionNode) => {
        await removeCollection(node);
        clusterConnectionTreeProvider.refresh();
        await cacheService.updateBucketCache(node.bucketName, true);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.refreshCollections,
      async (node: ScopeNode) => {
        clusterConnectionTreeProvider.refresh(node);
        clusterConnectionTreeProvider.refresh(node.parentNode);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.getBucketMetaData,
      async (node: BucketNode) => {
        getBucketMetaData(node, context);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.getDocumentMetaData,
      async (node: DocumentNode) => {
        getDocumentMetaData(node, context);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.searchDocument,
      async (node: CollectionNode) => {
        await searchDocument(node, uriToCasMap, memFs);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.queryTypeDocumentFilter,
      async (node: CollectionNode) => {
        await queryTypeFilterDocuments(node);
        clusterConnectionTreeProvider.refresh(node.parentNode);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.kvTypeDocumentFilter,
      async (node: CollectionNode) => {
        await kvTypeFilterDocuments(node);
        clusterConnectionTreeProvider.refresh(node.parentNode);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.editQueryTypeDocumentFilter,
      async (node: CollectionNode) => {
        await queryTypeFilterDocuments(node);
        clusterConnectionTreeProvider.refresh(node.parentNode);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.editKvTypeDocumentFilter,
      async (node: CollectionNode) => {
        await kvTypeFilterDocuments(node);
        clusterConnectionTreeProvider.refresh(node.parentNode);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.clearDocumentFilter,
      async (node: CollectionNode) => {
        await clearDocumentFilter(node);
        clusterConnectionTreeProvider.refresh(node.parentNode);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.refreshIndexes,
      async (node: IndexDirectory) => {
        const connection = Memory.state.get<IConnection>(Constants.ACTIVE_CONNECTION);
        if (!connection) {
          return;
        }
        clusterConnectionTreeProvider.refresh(node);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.openQueryNotebook,
      async () => {
        createNotebook();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.openQueryWorkbench,
      async () => {
        const connection = Memory.state.get<IConnection>(Constants.ACTIVE_CONNECTION);
        if (!connection) {
          return;
        }
        workbench.openWorkbench(memFs);
      }
    )
  );

  // Initialize the global status bar item which will be used for query and search query context
  let globalStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
  globalStatusBarItem.hide(); 

  vscode.languages.registerDocumentFormattingEditProvider('SQL++', {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      return sqlppFormatter(document);
    },
  });

  vscode.languages.registerCompletionItemProvider("SQL++", {
    provideCompletionItems() {
      return sqlppComlpletions();
  }});

  vscode.languages.registerCompletionItemProvider("SQL++", {
    provideCompletionItems(document, position) {
      return sqlppNamedParametersCompletions(document, position);
  }}, '$');

  let sqlppSchemaComlpletionsDisposable: vscode.Disposable | undefined = undefined;

  CacheService.eventEmitter.on("cacheSuccessful", ()=>{
    if(sqlppSchemaComlpletionsDisposable){
      sqlppSchemaComlpletionsDisposable.dispose();
    }

    sqlppSchemaComlpletionsDisposable = vscode.languages.registerCompletionItemProvider("SQL++", {
      provideCompletionItems() {
        return sqlppSchemaComlpletions(cacheService);
    }});
  });

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.getClusterOverview,
      async (node: ClusterConnectionNode) => {
        fetchClusterOverview(node, context, false);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.refreshClusterOverview,
      async (node: ClusterConnectionNode) => {
        fetchClusterOverview(node, context, true); // Setting refresh to true so that all data is refetched
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.dataExport,
      async () => {
        await dataExport(context);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.mdbMigrate,
      async () => {
        await mdbMigrate(context);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.dynamodbMigrate,
      async () => {
        await dynamodbMigrate(context);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.dataImport,
      async () => {
        await new DataImport().dataImport(context);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(Commands.queryContext, () => {
      fetchQueryContext(workbench, context, globalStatusBarItem);
    })
  );

  // subscription to make sure query context status bar is only visible on sqlpp files
  subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      await handleQueryContextStatusbar(editor, workbench, globalStatusBarItem);
    })
  );
  // // Handle initial view of context status bar
  const activeEditor = vscode.window.activeTextEditor;
  handleQueryContextStatusbar(activeEditor, workbench, globalStatusBarItem);

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.showFavoriteQueries,
      () => {
        fetchFavoriteQueries(context);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.markFavoriteQuery,
      async () => {
        await markFavoriteQuery(context);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.showNamedParameters,
      () => {
        fetchNamedParameters();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.refreshNamedParameters,
      () => {
        fetchNamedParameters(true);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.applyQueryHistory,
      (item) => {
        applyQuery(item);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.deleteQueryHistoryItem,
      async (item) => {
        await deleteQueryItem(item, queryHistoryTreeProvider);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.copyQueryHistoryItem,
      (item) => {
        copyQuery(item);
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      Commands.refreshQueryHistory,
      () => {
        queryHistoryTreeProvider.refresh();
      }
    )
  );

  const queryHistoryTreeProvider = new QueryHistoryTreeProvider(context);
  vscode.window.registerTreeDataProvider('query-history', queryHistoryTreeProvider);

  subscriptions.push(
    vscode.commands.registerCommand(Commands.getSampleProjects, async () => {
      getSampleProjects(context);
    })
  );

  const searchContextCommand = vscode.commands.registerCommand(Commands.searchContext, () => {
    fetchSearchContext(currentSearchIndexNode, currentSearchWorkbench, context, globalStatusBarItem);
  });
  context.subscriptions.push(searchContextCommand);



  const openSearchWorkbenchCommand = vscode.commands.registerCommand(Commands.openSearchWorkbench, async (searchIndexNode: SearchIndexNode) => {
    const connection = Memory.state.get<IConnection>(Constants.ACTIVE_CONNECTION);
    if (!connection) {
      vscode.window.showErrorMessage("No active connection available.");
      return;
    }

    currentSearchIndexNode = searchIndexNode;
    currentSearchWorkbench = searchWorkbench;

    searchWorkbench.openSearchWorkbench(searchIndexNode, memFs);


  });
  context.subscriptions.push(openSearchWorkbenchCommand);


  subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor && editor.document.languageId === "json" && editor.document.fileName.endsWith(".cbs.json")) {
        await handleSearchContextStatusbar(editor, currentSearchIndexNode, searchWorkbench, globalStatusBarItem);
      }
    })
  );


  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      Constants.notebookType, new QueryContentSerializer(), { transientOutputs: true }
    ),
    new QueryKernel()
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.runQuery, async () => {
      vscode.commands.executeCommand(
        "setContext",
        "vscode-couchbase.runButtonEnabled",
        undefined
      );
      await workbench.runCouchbaseQuery(
        workbenchWebviewProvider,
        queryHistoryTreeProvider
      );
      vscode.commands.executeCommand(
        "setContext",
        "vscode-couchbase.runButtonEnabled",
        true
      );
    })
  );
  vscode.commands.executeCommand(
    "setContext",
    "vscode-couchbase.runButtonEnabled",
    true
  ); // Required to enable run query button at the start

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.runSearchQuery, async (searchIndexNode: SearchIndexNode) => {
      vscode.commands.executeCommand(
        "setContext",
        "vscode-couchbase.runSearchButtonEnabled",
        undefined
      );
      await searchWorkbench.runCouchbaseSearchQuery(
        workbenchWebviewProvider
      );
      vscode.commands.executeCommand(
        "setContext",
        "vscode-couchbase.runSearchButtonEnabled",
        true
      );
    })
  );
  vscode.commands.executeCommand(
    "setContext",
    "vscode-couchbase.runSearchButtonEnabled",
    true
  ); // Required to enable run search query button at the start


  context.subscriptions.push(
    vscode.commands.registerCommand(
      Commands.checkAndCreatePrimaryIndex,
      async (elementData: any) => {
        checkAndCreatePrimaryIndex(elementData);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.ddlExport, async () => {
      ddlExport();
    })
  );

}

// this method is called when your extension is deactivated
export function deactivate() { }

import * as vscode from 'vscode';
import * as path from 'path';
import { getWebviewContent } from '../webViews/workbench.webview';
import { QueryResult, QueryStatus } from 'couchbase';


type IQueryStatusProps = {
    queryStatus: QueryStatus | undefined;
    rtt?: string;
    elapsed?: string;
    executionTime?: string;
    numDocs?: string | undefined;
    size?: string,
};
export class WorkbenchWebviewProvider implements vscode.WebviewViewProvider {
    public _view?: vscode.WebviewView;
    public _context: vscode.ExtensionContext;
    public _queryResult: string;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._queryResult = "";
    }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        this._view.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this._context.extensionPath, "dist"))
            ]
        };

        const reactAppPathOnDisk = vscode.Uri.file(
            path.join(this._context.extensionPath, "dist", "reactBuild.js")
        );

        const reactAppUri = this._view.webview.asWebviewUri(reactAppPathOnDisk);
        this._view.webview.html = getWebviewContent(reactAppUri, this._context);
        const isDarkTheme: boolean = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
        this._view?.webview.postMessage({ command: "theme", isDarkTheme });
    }

    async sendQueryResult(queryResult: string, queryStatus: IQueryStatusProps, plan: string | null) {
        const isDarkTheme: boolean = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
        this._view?.webview.postMessage({ command: "queryResult", result: queryResult, queryStatus: queryStatus, explainPlan: plan, isDarkTheme });
    }

    async setQueryResult(queryResult: string, queryStatus: IQueryStatusProps, plan: string | null) {
        this._view?.show();
        this._queryResult = queryResult;
        this.sendQueryResult(queryResult, queryStatus, plan);
        this._view?.show();
    }
}
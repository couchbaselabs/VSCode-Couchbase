import { IKeyValuePair } from "../types/IKeyValuePair";
import * as vscode from "vscode";
import fs from 'fs';
import path from 'path';

export function getUsersNamedParameters(): IKeyValuePair[] {
    try {
        let config = vscode.workspace.getConfiguration('couchbase');
        let userNamedParametersObject = config.get<{ [key: string]: string }>('workbench.userNamedParameters');
        if (!userNamedParametersObject) {
            return [];
        }
        let userNamedParameters: IKeyValuePair[] = Object.entries(
            userNamedParametersObject
        ).map(([key, value]) => ({ key, value }));
        return userNamedParameters;
    } catch (error) {
        console.log("Error reading userNamedParameters from config:", error);
        return [];
    }
}

export function getProjectsNamedParameters(): IKeyValuePair[] {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        let namedParameters: IKeyValuePair[] = [];
        try {
            const rootPath = workspaceFolders[0].uri.fsPath;
            const filePath = path.join(rootPath, '.cbNamedParams.properties');
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const lines = fileContent.split('\n');

            for (let line of lines) {
                if (line.trim().length === 0) continue; 
                const [key, value] = line.split('=');
                try {
                    namedParameters.push({ key: key.trim(), value: JSON.parse(value.trim()) });
                } catch (e) {
                    namedParameters.push({ key: key.trim(), value: value.trim() });
                }
            }
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log('.cbNamedParams.properties file does not exist');
            } else {
                console.error('Error reading .cbNamedParams.properties file:', error);
            }
        }
        return namedParameters;
    } else {
        return [];
    }
}

export function getAllNamedParameters(): {[key: string]: any} {
    const userNamedParameters = getUsersNamedParameters();
    const projectNamedParameters = getProjectsNamedParameters();

    // if any parameter is repeated, then the user's parameter will be used
    let allNamedParameters: {[key: string]: any} = {};
    
    for (let parameter of projectNamedParameters) {
        allNamedParameters[parameter.key] = parameter.value;
    }

    for (let parameter of userNamedParameters) {
        allNamedParameters[parameter.key] = parameter.value;
    }

    return allNamedParameters;
}
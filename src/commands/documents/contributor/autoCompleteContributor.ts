import * as vscode from 'vscode';
import * as jsonc from 'jsonc-parser';
import { fieldsContributor } from '../../fts/SearchWorkbench/contributor/fieldsContributor';
import { extractDocumentInfo } from '../../../util/common';

export class JsonAttributeCompletionProvider implements vscode.CompletionItemProvider {
    private fieldCache: Record<string, { type: string, value: any }>;

    constructor(document: vscode.TextDocument, cache: any) {
        const documentInfo = extractDocumentInfo(document.uri.path);
        const schemaCache = cache.getCache(documentInfo.bucket);
        const fields = fieldsContributor.extractFieldsFromCollection(
            schemaCache,
            documentInfo.scope,
            documentInfo.collection,
        );
        this.fieldCache = fields.reduce((cache: any, currentField: any) => ({
            ...cache,
            ...this.flattenCache(currentField)
        }), {});
    }

    private flattenCache(obj: any): Record<string, { type: string, value: any }> {
        let result: Record<string, { type: string, value: any }> = {};
        for (const key in obj) {
            const value = obj[key];
            result[key] = value;

            if (value.type === 'array' && typeof value.value === 'object') {
                this.extractArrayFields(value.value, result);
            } else if (typeof value === 'object' && value !== null && value.type === 'object') {
                Object.assign(result, this.flattenCache(value.value));
            }
        }
        return result;
    }

    private extractArrayFields(obj: any, result: Record<string, { type: string, value: any }>) {
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'object' && value !== null && value.type) {
                result[key] = value;
                if (value.type === 'object' && typeof value.value === 'object') {
                    this.extractArrayFields(value.value, result);
                }
            } else {
                result[key] = value;
            }
        }
    }


    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
        const text = document.getText();
        const rootNode = jsonc.parseTree(text);
        const offset = document.offsetAt(position);
        if (!rootNode) {
            return [];
        }
        const currentNode = jsonc.findNodeAtOffset(rootNode, offset, true);
        if (!currentNode) {
            return [];
        }
        const isKey = this.isKey(document, position);
        if (!isKey) {
            return []
        }
        let existingKeys = new Set<string>();
        const currentNodeKeys = this.collectKeysFromCurrentNode(currentNode);
        currentNodeKeys.forEach(key => existingKeys.add(key));
        return this.suggestAttributes(existingKeys, position, document);
    }



    private collectKeysFromCurrentNode(currentNode: jsonc.Node): Set<string> {
        let keys = new Set<string>();
        if (currentNode.type === "string") {
            if (currentNode.parent && currentNode.parent.parent) {
                const propertyNode = currentNode.parent.parent;
                if (propertyNode.children) {
                    propertyNode.children.forEach(child => {
                        if (child.type === 'property' && child.children && child.children[0].type === 'string') {
                            keys.add(child.children[0].value);
                        }
                    });
                }
            }
        } else if (currentNode && currentNode.type === 'object' && currentNode.children) {
            currentNode.children.forEach(child => {
                if (child.type === 'property' && child.children && child.children[0].type === 'string') {
                    keys.add(child.children[0].value);
                }
            });
        }
        return keys;
    }


    private suggestAttributes(existingKeys: Set<string>, position: vscode.Position, document: vscode.TextDocument): vscode.CompletionItem[] {
        let suggestions: vscode.CompletionItem[] = [];
        const isWithinQuotes = this.isWithinQuotes(document, position)

        Object.keys(this.fieldCache).forEach(key => {
            if (this.shouldSuggestKey(key, existingKeys)) {
                const suggestionKey = key;

                let itemText = suggestionKey;
                let insertText = suggestionKey;

                if (!isWithinQuotes) {
                    itemText = `"${suggestionKey}"`;
                    insertText = `"${suggestionKey}": `;
                }

                const item = new vscode.CompletionItem(itemText, vscode.CompletionItemKind.Field);
                item.insertText = insertText;
                suggestions.push(item);
            }
        });
        return suggestions;
    }

    private shouldSuggestKey(key: string, existingKeys: Set<string>): boolean {
        if (existingKeys.has(key)) {
            return false;
        }
        return true;
    }

    isKey(document: vscode.TextDocument, position: vscode.Position): boolean {
        const lineText = document
            .lineAt(position.line)
            .text.substring(0, position.character);

        if (/^\s*[\{,]\s*$/.test(lineText)) {
            return true;
        }

        let depth = 0;
        for (let i = position.character - 1; i >= 0; i--) {
            const char = lineText[i];
            switch (char) {
                case ":":
                    if (depth === 0) return false;
                    break;
                case "{":
                case "[":
                    depth++;
                    break;
                case "}":
                case "]":
                    depth--;
                    break;
            }
        }

        return true;
    }

    private isWithinQuotes(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): boolean {
        const lineText = document.lineAt(position.line).text;
        const charPos = position.character;

        let quoteOpen = false;
        let quoteClose = false;

        for (let i = charPos - 1; i >= 0; i--) {
            if (lineText[i] === '"' && (i === 0 || lineText[i - 1] !== "\\")) {
                quoteOpen = true;
                break;
            }
        }

        for (let i = charPos; i < lineText.length; i++) {
            if (lineText[i] === '"' && (i === 0 || lineText[i - 1] !== "\\")) {
                quoteClose = true;
                break;
            }
        }

        return quoteOpen && quoteClose;
    }
}

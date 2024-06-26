import CollectionNode from "../../../model/CollectionNode";
import * as vscode from "vscode";
import { Memory } from "../../../util/util";
import { logger } from "../../../logger/logger";
import { ParsingFailureError, PlanningFailureError } from "couchbase";
import { getActiveConnection } from "../../../util/connections";
import { clearDocumentFilter } from "./clearDocumentFilter";

export const queryTypeFilterDocuments = async (node: CollectionNode) => {
    const connection = getActiveConnection();
    if (!connection) {
        return;
    }
    // Check if indexes are present for collection
    const indexExists = await node.getIndexedField();
    if (indexExists === null) {
        // Index Doesn't Exists
        vscode.window.showErrorMessage(
            "Filters can only be applied to collections that have at least one index."
        );
        logger.error(
            "Error setting document filter: index doesn't exist"
        );
        return false;
    }

    const docFilter = Memory.state.get<string>(
        `queryTypeFilterDocuments-${connection.connectionIdentifier}-${node.bucketName}-${node.scopeName}-${node.collectionName}`
    );
    const filterStmt: string = docFilter ?? "";
    let collectionName = node.collectionName;
    if (collectionName.length > 15) {
        collectionName = collectionName.substring(0, 13) + "...";
    }
    const newDocFilterStmt = await vscode.window.showInputBox({
        title: `Apply filter for collection \`${collectionName}\``,
        placeHolder: `airline="AI" OR country="United States"`,
        value: filterStmt,
        prompt: `SELECT meta.id() FROM \`${collectionName}\` WHERE [Your Filter] | This may reset other document filters | `,
        validateInput: (input) => {
            const tokens = input.split(" ");
            for (const token of tokens) {
                if (
                    token.trim().toUpperCase() === "OFFSET" ||
                    token.trim().toUpperCase() === "LIMIT"
                ) {
                    return "The filters should not contain LIMIT and OFFSET";
                }
            }
            return null;
        },
    });
    if (newDocFilterStmt === undefined) {
        return;
    }
    try {
        if (newDocFilterStmt.trim() !== "") {
            await connection.cluster?.query(`SELECT META().id FROM \`${node.bucketName}\`.\`${node.scopeName}\`.\`${collectionName}\` WHERE ${newDocFilterStmt}`);
        }
    } catch (err) {
        if (err instanceof ParsingFailureError) {
            vscode.window.showErrorMessage(
                "Parsing Failed: Incorrect filter definition"
            );
        }
        else if (err instanceof PlanningFailureError) {
            vscode.window.showErrorMessage(
                "Planning Failed: Incorrect filter definition, check if the query is correct"
            );
        }
        else {
            logger.error(err);
        }
        return;
    }

    // Reset any existing document filter
    clearDocumentFilter(node);

    Memory.state.update(
        `filterDocumentsType-${connection.connectionIdentifier}-${node.bucketName}-${node.scopeName}-${node.collectionName}`,
        `query`
    );

    Memory.state.update(
        `queryTypeFilterDocuments-${connection.connectionIdentifier}-${node.bucketName}-${node.scopeName}-${node.collectionName}`,
        newDocFilterStmt.trim()
    );
};

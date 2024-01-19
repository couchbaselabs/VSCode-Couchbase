import axios from "axios";
import * as vscode from 'vscode';
import { logger } from "../../logger/logger";
import { feedbackLambdaMessageType, iqChatResult } from "./chat/types";


export class iqRestApiService {
    private static readonly CAPELLA_URL_DOMAIN = "https://api.dev.nonprod-project-avengers.com"; // TODO: change here before prod release
    private static readonly SESSIONS_API_URL = `${this.CAPELLA_URL_DOMAIN}/sessions`;
    private static readonly FETCH_ORGANIZATIONS_URL = `${this.CAPELLA_URL_DOMAIN}/v2/organizations`;

    public static capellaLogin = async (username: string, password: string) => {
        let content = await axios.post(this.SESSIONS_API_URL, {}, {
            auth: {
                username: username,
                password: password
            }
        });
        return content.data.jwt;
    };

    public static capellaLogout = async (jwt: string) => {
        await axios.delete(this.SESSIONS_API_URL, {
            headers: {
                Authorization: `Bearer ${jwt}`
            }
        });
    };

    public static loadOrganizations = async (jwt: string) => {
        let content = await axios.get(this.FETCH_ORGANIZATIONS_URL, {
            headers: {
                Authorization: `Bearer ${jwt}`
            }
        });
        return content.data.data;
    };

    public static getOrganizationDetails = async (jwt: string, orgId: string) => {
        let content = await axios.get(this.FETCH_ORGANIZATIONS_URL + "/" + orgId, {
            headers: {
                Authorization: `Bearer ${jwt}`
            }
        });
        return content.data.data[0];
    };

    public static sendIqMessage = async (jwt: string, orgId: string, messageBody: any): Promise<iqChatResult> => {
        let result: iqChatResult = {
            content: "",
            error: undefined,
            status: ""
        };

        try {
            let content = await axios.post(`${this.CAPELLA_URL_DOMAIN}/v2/organizations/` + orgId + "/integrations/iq/openai/chat/completions",
                messageBody,
                {
                    headers: {
                        Authorization: "Bearer " + jwt,
                        "Content-Type": "application/json",
                        Connection: "keep-alive"
                    },
                },
            );

            if (content.data.choices === undefined || content.data.choices.length === 0) {
                result.status = "NoLogout";
                result.error = content.data.error;
                return result;
            }
            result.content = content.data.choices[0].message.content;
            result.status = content.status.toString();
        }
        catch (error: any) {
            try {
                if (error.response && error.response.status === 401) {
                    result.error = "The current session has expired, Please login again";
                    result.status = "401";
                }
                else if (error.response.data !== undefined && error.response.data.errorType !== undefined) {
                    result.error = error.response.data.message;
                    result.status = error.response.data.errorType;
                }
                else if (error.status) {
                    result.error = error.statusText;
                    result.status = error.status;
                }
                 else if (error.response) {
                    result.error = error.response;
                    result.status = error.response.status.toString();
                }
                else {

                    logger.error("Error while receiving message from iQ: " + error);
                    result.status = "400";
                    result.error = "Error while receiving message from iQ: " + error;

                }
            } catch (e) {
                result.status = "400";
                result.error = "Error while processing iQ message";
            }
        }
        return result;
    };

    public static sendMessageToLambda = async (context: vscode.ExtensionContext, message: feedbackLambdaMessageType) => {
        const URL = context.globalState.get<string>('feedbackLambdaUrl');
        await axios.post(URL || "", message,
            {
                headers: {
                    "X-Secret": context.globalState.get<string>('feedbackLambdaSecret')
                }
            }
        );
    };
}
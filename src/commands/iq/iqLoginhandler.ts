import { Constants } from "../../util/constants";
import { Global, Memory } from "../../util/util";
import { iqRestApiService } from "./iqRestApiService";
import * as keytar from 'keytar';

interface IFormData {
    username: string;
    password: string;
    rememberMe: boolean;
}

export interface ISavedLoginDataGetter {
    doesLoginDetailsExists: boolean;
    username: string
}

const getSessionsJwt = async (formData: IFormData): Promise<string> => {
    try {
        return await iqRestApiService.capellaLogin(formData.username, formData.password);
    } catch (error: any) {
        throw new Error(error.message.toString());
    }
};


export const iqLoginHandler = async (formData: IFormData) => {
    try {
    // Check for remember me
        if (formData.rememberMe === true) {
            Global.state.update(Constants.IQ_USER_ID, formData.username);
            keytar.setPassword(Constants.IQ_PASSWORD, formData.username, formData.password);
        }

        // Return organization select page data
        const jwtToken = await getSessionsJwt(formData);
        Memory.state.update("vscode-couchbase.iq.jwtToken", jwtToken);
        const organizations = await iqRestApiService.loadOrganizations(jwtToken);
        return organizations;
    } catch(error: any){
        throw new Error(error.message.toString());
    }
};

export const iqSavedLoginDataGetter = async (): Promise<ISavedLoginDataGetter> => {
    const username = Global.state.get<string>(Constants.IQ_USER_ID);
    if (username && username !== "") {
        // Username exists, sending it back to webview
        return {
            doesLoginDetailsExists: true,
            username: username
        };
    } else {
        return {
            doesLoginDetailsExists: false,
            username: ""
        };
    }
};

export const iqSavedLoginHandler = async (username: string) => {
    try {
        const password = await keytar.getPassword(Constants.IQ_PASSWORD, username);
        if (password) {
            // Return organization select page data
            const jwtToken = await getSessionsJwt({
                username: username,
                password: password,
                rememberMe: true
            });
            Memory.state.update("vscode-couchbase.iq.jwtToken", jwtToken);
            const organizations = await iqRestApiService.loadOrganizations(jwtToken);
            return organizations;
        } else {
            return undefined;
        }
    } catch(error: any) {
        throw new Error(error.message.toString());
    }
};

export const verifyOrganization = async (orgId: string): Promise<any> => {
    const jwtToken = Memory.state.get<string>("vscode-couchbase.iq.jwtToken");
    if (jwtToken === undefined) {
        return {
            isOrgVerified: false,
            errorMessage: ""
        };
    }
    const orgDetails = await iqRestApiService.getOrganizationDetails(jwtToken, orgId);
    if (!orgDetails.iq || orgDetails.iq.enabled === false) {
        return {
            isOrgVerified: false,
            errorMessage: `Capella iQ is not enabled for this organization, Please enable it on cloud.couchbase.com`
        };
    }
    if (orgDetails.iq.other.isTermsAcceptedForOrg === false) {
        return {
            isOrgVerified: false,
            errorMessage: `Terms and conditions to use Capella iQ are not accepted for this organization, Please accept it on cloud.couchbase.com`
        };
    }
    return {
        isOrgVerified: true,
        errorMessage: ""
    };
};
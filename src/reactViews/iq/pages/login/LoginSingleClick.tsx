import { useEffect } from "react";
import { IqLogin } from "./Login";
import "./LoginPage.scss";

const LoginSingleClick = ({ userId, setIsLoading, setShowPage, logoutReason = "" }) => {
    const singleClickSignIn = () => {
        setIsLoading(true);
        tsvscode.postMessage({
            command: "vscode-couchbase.iq.singleClickSignIn",
            value: {
                username: userId,
            },
        });
    };

    useEffect(() => {
        setIsLoading(false);
        tsvscode.postMessage({
            command: "vscode-couchbase.iq.showLogoutButton",
            value: {
                enabled: false,
            },
        });

        tsvscode.postMessage({
            command: "vscode-couchbase.iq.showNewChatButton",
            value: {
                enabled: false,
            },
        });
    }, []);

    return (
        <div className="login-page">
            <h1>Welcome to Capella iQ</h1>
            <p>
                Need a productivity boost? Try chatting with Capella iQ, our LLM
                powered AI Chat Service. Capella iQ is a generative AI-powered
                coding assistant that helps developers instantly become more
                productive.
            </p>
            <div className="capella-login-area">
                {logoutReason.length > 0 && (
                    <div className="logout-reason">{logoutReason}</div>
                )}
                <h2>Sign In to Capella</h2>
                <button
                    className="redButton"
                    onClick={() => {
                        singleClickSignIn();
                    }}
                >
                    Sign in as {userId}
                </button>

                <div className="orArea">
                    <div className="divider"></div>
                    OR
                    <div className="divider"></div>
                </div>

                <button
                    className=""
                    onClick={() => {
                        setShowPage(<IqLogin setIsLoading={setIsLoading}/>);
                    }}
                >
                    Login with different credentials
                </button>
            </div>
        </div>
    );
};

export default LoginSingleClick;

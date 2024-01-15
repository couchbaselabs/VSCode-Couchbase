import { useEffect, useState } from "react";
import "./LoginPage.scss";

interface IFormData {
    username: string;
    password: string;
    rememberMe: boolean;
}

export const Login = ({ logoutReason = "" }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const handleRememberMeChange = (event) => {
        setRememberMe(event.target.checked);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        let formData: IFormData = {
            username: username,
            password: password,
            rememberMe: rememberMe,
        };

        //setIsLoading(true);

        tsvscode.postMessage({
            command: "vscode-couchbase.iq.login",
            value: formData,
        });
    };

    const handleNewAccountClick = () => {
        const link = "https://cloud.couchbase.com/sign-up";
        tsvscode.postMessage({
            command: "vscode-couchbase.iq.openLinkInBrowser",
            value: link
        });
          
    };

    useEffect(() => {
        tsvscode.postMessage({
          command: "vscode-couchbase.iq.showLogoutButton",
          value: {
            enabled: false
          }
        });
    
        tsvscode.postMessage({
          command: "vscode-couchbase.iq.showNewChatButton",
          value: {
            enabled: false
          }
        });
      }, []);

    return (
        <div className="login-page">
            <h1>Welcome to Couchbase iQ</h1>
            <p>
                Need a productivity boost? Try chatting with Capella iQ, our AI
                cloud service. Capella iQ is a generative AI-powered coding
                assistant that helps developers instantly become more
                productive.
            </p>
            <div className="capella-login-area">
                {logoutReason.length > 0 && (
                    <div className="logout-reason">{logoutReason}</div>
                )}
                <h2>Sign In to Capella</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Username:
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                        />
                    </label>
                    <label>
                        Password:
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                        />
                    </label>
                    <div className="checkbox-container">
                        <label htmlFor="rememberMe">Remember me:</label>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={handleRememberMeChange}
                        />
                    </div>
                    <input
                        type="submit"
                        value="Sign in"
                        className="redButton"
                    />
                </form>
                <span id="create-account" onClick={handleNewAccountClick}>Don't have an account yet?</span>
            </div>
        </div>
    );
};

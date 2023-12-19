import { useEffect, useState } from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import "./IqChat.scss";
import { MainContainer } from "./../../chatscope/src/components/MainContainer/MainContainer";
import { ChatContainer } from "../../chatscope/src/components/ChatContainer/ChatContainer";
import MessageList from "../../chatscope/src/components/MessageList/MessageList";
import { Message } from "../../chatscope/src/components/Message/Message";
import { MessageInput } from "../../chatscope/src/components/MessageInput/MessageInput";
import { TypingIndicator } from "../../chatscope/src/components/TypingIndicator/TypingIndicator";
import {v4 as uuid} from 'uuid';

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  nightOwl,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import {
  ActionBar,
  IActionBarButton,
} from "chatscope/src/components/ActionBar/ActionBar";
import { ChatAction } from "utils/ChatAction";
import { SendFeedback } from "components/chatActions/SendFeedback";

export type userMessage = {
  message: string;
  sender: string;
  qaId: string;
  feedbackSent?: boolean;
  msgDate?: string;
};

export type iqMessages = {
  userChats: userMessage[],
  chatId: string
};

const IqChat = ({ org }) => {
  const [messages, setMessages] = useState<iqMessages>
    ({
        userChats: [
        {
          message: "Hello, I'm Couchbase IQ! Ask me anything!",
          sender: "assistant",
          msgDate: (Date.now()/1000).toFixed(0),
          qaId: "firstMessage"
        },
      ], 
      chatId: uuid()
    });
  const [isTyping, setIsTyping] = useState(false);
  const [codeTheme, setCodeTheme] = useState(oneLight);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalData, setFeedbackModalData] = useState({
    msgIndex: -1,
    qaId: ""
  });


  useEffect(()=>{
    console.log(messages);
  }, [messages]);

  const [actions, setActions] = useState<IActionBarButton[]>([
    {
      onclick: ()=>{
        setShowFeedbackModal(true);
        setFeedbackModalData({
          msgIndex: 0,
          qaId: "firstMessage"
        });
      },
      name: "Send Feedback",
    },
    {
      onclick: () => {},
      name: "Cluster Overview",
    },
    {
      onclick: () => {},
      name: "Open Workbench",
    },
    {
      onclick: () => {},
      name: "Data Export",
    },
    {
      onclick: () => {},
      name: "Data Import",
    },
  ]);

  const handleMessageLike = (index: number, qaId: string) => {
    const originalReply = messages.userChats[index].message;
    const originalQuestion = index - 1 > 0 ? messages.userChats[index - 1].message : "";
    const newMessage:userMessage = {
      message:
        "Glad you liked the result. Would you like to give more feedback",
      sender: "feedback",
      msgDate: (Date.now()/1000).toFixed(0),
      qaId: qaId
    };

    const messagesCopy = [...messages.userChats];
    messagesCopy[index].feedbackSent = true;

    const updatedMessages = [...messagesCopy, newMessage];
    setMessages({
      chatId: messages.chatId,
      userChats: updatedMessages
    });
    setActions([
      {
        onclick:()=>{
          setShowFeedbackModal(true);
          setFeedbackModalData({
            msgIndex: index,
            qaId: qaId
          });
        },
        name: "Send Feedback",
      },
    ]);

    // send info to lambda
    tsvscode.postMessage({
      command: "vscode-couchbase.iq.sendFeedbackPerMessageEmote",
      value: {
        type: "like",
        question: originalQuestion,
        reply: originalReply,
        msgDate: newMessage.msgDate,
        additionalFeedback: "",
        qaId: qaId,
        chatId: messages.chatId,
        orgId: org.data.id
      },
    });
  };

  const handleMessageDislike = (index: number, qaId: string) => {
    const originalReply = messages.userChats[index].message;
    const originalQuestion = index - 1 > 0 ? messages.userChats[index - 1].message : "";
    const newMessage:userMessage = {
      message:
        "Oh! We are very sorry. Can you please give us additional info via feedback",
      sender: "feedback",
      msgDate: (Date.now()/1000).toFixed(0),
      qaId: qaId
    };

    const messagesCopy = [...messages.userChats];
    messagesCopy[index].feedbackSent = true;

    const updatedMessages = [...messagesCopy, newMessage];
    setMessages({
      chatId: messages.chatId,
      userChats: updatedMessages
    });
    // set actions to feedback
    setActions([
      {
        onclick: () => {
          setShowFeedbackModal(true);
          setFeedbackModalData({
            msgIndex: index,
            qaId: qaId
          });
        },
        name: "Send Feedback",
      },
    ]);

    tsvscode.postMessage({
      command: "vscode-couchbase.iq.sendFeedbackPerMessageEmote",
      value: {
        type: "dislike",
        question: originalQuestion,
        reply: originalReply,
        msgDate: newMessage.msgDate,
        additionalFeedback: "",
        qaId: qaId,
        chatId: messages.chatId
      },
    });
    // send info to lambda
  };

  const handleFeedbackSubmit = (feedbackText) => {
    const index = feedbackModalData.msgIndex;
    const qaId = feedbackModalData.qaId;
    const originalReply = messages.userChats[index].message;
    const originalQuestion = index - 1 > 0 ? messages.userChats[index - 1].message : "";


    tsvscode.postMessage({
      command: "vscode-couchbase.iq.sendFeedbackPerMessageEmote",
      value: {
        type: null,
        question: originalQuestion,
        reply: originalReply,
        msgDate: ((Date.now())/1000).toFixed(0),
        additionalFeedback: feedbackText,
        qaId: qaId,
        chatId: messages.chatId
      },
    });
  };

  const SyntaxHighlight = ({ language, value }) => {
    return (
      <SyntaxHighlighter
        style={codeTheme}
        language={language}
        children={value}
      />
    );
  };

  const handlePaste = (event) => {
    // Prevent the original paste action
    event.preventDefault();
    const text = event.clipboardData.getData("text");
    const selection = window.getSelection();

    if (selection.rangeCount) {
      selection.deleteFromDocument();
      selection.getRangeAt(0).insertNode(document.createTextNode(text));
    }

    const inputEvent = new Event("input", { bubbles: true });
    event.target.dispatchEvent(inputEvent);
  };

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "vscode-couchbase.iq.getMessageFromIQ": {
        if (message.isDarkTheme) {
          setCodeTheme(nightOwl);
        } else {
          setCodeTheme(oneLight);
        }

        const newMessage: userMessage = {
          message: message.content,
          sender: "assistant",
          feedbackSent: false,
          msgDate: message.msgDate,
          qaId: message.qaId // TODO: get qaId 
        };
        const updatedMessages = [...messages.userChats, newMessage];

        setMessages({
          chatId: messages.chatId,
          userChats: updatedMessages
        });

        setIsTyping(false);
        break;
      }
      case "vscode-couchbase.iq.changeColorTheme": {
        if (message.theme === "Dark") {
          setCodeTheme(nightOwl);
        } else {
          setCodeTheme(oneLight);
        }
        break;
      }
    }
  });

  const handleSendRequest = async (message: string) => {
    const newMessage:userMessage = {
      message,
      sender: "user",
      msgDate: (Date.now()/1000).toFixed(0),
      qaId: uuid()
    };

    const updatedMessages = [...messages.userChats, newMessage];
    setMessages({
      chatId: messages.chatId,
      userChats: updatedMessages
    });
    setIsTyping(true);

    try {
      // Send message to CB IQ
      tsvscode.postMessage({
        command: "vscode-couchbase.iq.sendMessageToIQ",
        value: {
          newMessage: newMessage.message,
          orgId: org.data.id,
          userChats: updatedMessages,
          chatId: messages.chatId,
          qaId: newMessage.qaId
        },
      });
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  return (
    <div>
      <MainContainer className="chatscope-main-container" responsive>
        <ChatContainer
          className="chatscope-chat-container"
          style={{
            flex: 1,
            minHeight: "400px",
            height: "95vh",
          }}
        >
          <MessageList
            className={`chatscope-message-list ${
              isTyping || actions.length > 0 ? "hasActionbar" : ""
            }`}
            scrollBehavior="smooth"
            actionbar={
              isTyping ? (
                <TypingIndicator content="IQ is typing" />
              ) : actions.length > 0 ? (
                <ActionBar buttons={actions} />
              ) : undefined
            }
          >
            {messages.userChats.map((message, index) => {
              if (message.sender !== "user") {
                const hasFooter =
                  message.sender !== "user" &&
                  message.sender !== "feedback" &&
                  index !== 0;
                return (
                  // If system/assistant is sending message, use markdown formatting
                  <Message
                    className={`chatscope-message ${
                      hasFooter ? "hasFooter" : ""
                    }`}
                    key={index}
                    model={{
                      payload: (
                        <Message.CustomContent>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            className="react-markdown"
                            components={{
                              code({ node, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(
                                  className || ""
                                );
                                return match ? (
                                  <SyntaxHighlight
                                    language={match[1]}
                                    value={String(children).replace(/\n$/, "")}
                                    {...props}
                                  />
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {message.message}
                          </ReactMarkdown>
                        </Message.CustomContent>
                      ),
                      direction:
                        message.sender === "user" ? "outgoing" : "incoming",
                      sender: message.sender,
                      position: "normal",
                    }}
                  >
                    {hasFooter ? (
                      <Message.Footer className="messageFooter">
                        {message.feedbackSent !== true ? (
                          <>
                            <div
                              className="likeButton"
                              onClick={() => handleMessageLike(index, message.qaId)}
                            >
                              👍
                            </div>
                            <div
                              className="dislikeButton"
                              onClick={() => handleMessageDislike(index, message.qaId)}
                            >
                              👎
                            </div>
                          </>
                        ) : (
                          <div className="feedbackSentFooter">
                            Thanks for voting!
                          </div>
                        )}
                      </Message.Footer>
                    ) : (
                      ""
                    )}
                  </Message>
                );
              } else {
                // If user is sending message, use plain text rendering only
                return (
                  <Message className="chatscope-message" key={index}>
                    <Message.TextContent>{message.message}</Message.TextContent>
                  </Message>
                );
              }
            })}
          </MessageList>
          <MessageInput
            onPaste={(event) => {
              handlePaste(event);
            }}
            sendButton={true}
            attachButton={false}
            placeholder="Type a message..."
            onSend={(msg) => handleSendRequest(msg)}
            className="chatscope-message-input"
          />

          
        </ChatContainer>
        {<SendFeedback isOpen={showFeedbackModal} onClose={()=>setShowFeedbackModal(false)} onSubmit={(text)=>handleFeedbackSubmit(text)}/>}
      </MainContainer>
    </div>
  );
};

export default IqChat;

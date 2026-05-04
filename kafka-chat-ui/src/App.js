import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "./App.css";

function App() {
  const [stompClient, setStompClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomInput, setRoomInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [sender, setSender] = useState("");
  const [content, setContent] = useState("");
  const [joined, setJoined] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojiPickerRef = useRef(null);
  const chatInputRef = useRef(null);

  const emojis = [
    "😀", "😂", "😍", "🤔", "😎", "🔥", "👍", "❤️", "🎉", "😢", "😡", "🤗", "💯", "✨", "🚀",
    "👋", "✋", "🤝", "👎", "👌", "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🍎", "🍌", "🍊", "🍇", "🍓", "🍑", "🍍", "🥝", "🍒", "🥕", "🥒", "🍅", "🥔", "🌽", "🥦"
  ];

  useEffect(() => {
    if (!roomId) return;
    if (stompClient) {
      stompClient.disconnect();
    }
    connect();
  }, [roomId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        chatInputRef.current &&
        !chatInputRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const connect = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8082/chat"),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/${roomId}`, (message) => {
          try {
            const body = JSON.parse(message.body).chat;

            const rawContent =
              body?.content ??
              body?.message ??
              body?.text ??
              body?.payload ??
              (typeof body === "string" ? body : "");

            const isSystemMessage = 
              body?.type === "system" || 
              body?.sender === "System" ||
              String(rawContent).includes("joined the room") ||
              String(rawContent).includes("left the room");

            const normalizedMessage = {
              sender:
                body?.sender ||
                body?.from ||
                body?.username ||
                body?.user ||
                body?.author ||
                body?.name ||
                "Unknown",
              content:
                typeof rawContent === "object"
                  ? JSON.stringify(rawContent)
                  : String(rawContent ?? "").trim(),
              timestamp: body?.timestamp
                ? Number(body.timestamp)
                : Date.now(),
              type: isSystemMessage ? "system" : "normal",
            };

            if (!normalizedMessage.content) {
              return;
            }

            setMessages((prev) => [...prev, normalizedMessage]);
          } catch (error) {
            console.warn("Invalid chat payload received:", message.body, error);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker error:", frame.headers["message"]);
      },
    });

    client.activate();
    setStompClient(client);
  };

  const sendMessage = () => {
    if (!content.trim()) return;

    const message = {
      sender,
      content,
      roomId,
      timestamp: Date.now(),
    };

    fetch("http://localhost:8081/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    setContent("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const joinRoom = () => {
    const trimmed = roomInput.trim();
    if (!trimmed || !sender.trim()) return;

    setMessages([]);
    setRoomId(trimmed);
    setJoined(true);

    // Send join notification to all users in the room
    const joinMessage = {
      sender: "System",
      content: `${sender} joined the room`,
      roomId: trimmed,
      timestamp: Date.now(),
      type: "system",
    };

    fetch("http://localhost:8081/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(joinMessage),
    });
  };

  const leaveRoom = () => {
    // Send leave notification to all users in the room
    const leaveMessage = {
      sender: "System",
      content: `${sender} left the room`,
      roomId,
      timestamp: Date.now(),
      type: "system",
    };

    fetch("http://localhost:8081/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leaveMessage),
    });

    if (stompClient?.deactivate instanceof Function) {
      stompClient.deactivate();
    } else if (stompClient?.disconnect instanceof Function) {
      stompClient.disconnect();
    }

    setStompClient(null);
    setRoomId("");
    setJoined(false);
    setMessages([]);
  };

  const addEmoji = (emoji) => {
    setContent(content + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          {joined && (
            <button className="back-button" onClick={leaveRoom}>
              <span className="arrow">←</span>
              <span>Back to lobby</span>
            </button>
          )}

          <div className="header-info">
            <div>
              <h3 className="chat-title">
                💬 {sender ? `${sender}'s chat` : "Chat room"}
              </h3>
              {joined && (
                <span className="room-id">
                  Room: {roomId}
                </span>
              )}
            </div>
            {joined && (
              <div className="live-chat">
                Live chat
              </div>
            )}
          </div>

          {!joined && (
            <div className="lobby-controls">
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Your name"
                className="input-field"
              />
              <input
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Enter room id"
                className="input-field"
              />
              <button
                onClick={() =>
                  setRoomInput(
                    `room-${Math.random().toString(36).slice(2, 8)}`
                  )
                }
                className="generate-button"
              >
                Generate room
              </button>
              <button
                onClick={joinRoom}
                className="join-button"
              >
                Join room
              </button>
            </div>
          )}
        </div>

        {joined && (
          <>
            <div className="chat-box" id="chatBox">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${
                    msg.type === "system"
                      ? "system-message"
                      : msg.sender === sender
                      ? "own"
                      : "other"
                  }`}
                >
                  {msg.type === "system" ? (
                    <div className="system-text">{msg.content}</div>
                  ) : (
                    <>
                      <div className="message-username">{msg.sender}</div>
                      <div className="message-content">
                        <p className="message-text">{msg.content}</p>
                        <span
                          className={`message-time ${
                            msg.sender === sender ? "right" : "left"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="chat-input" ref={chatInputRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="emoji-button"
              >
                😊
              </button>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="message-input"
              />
              <button onClick={sendMessage} className="send-button">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <polygon points="4,4 16,10 4,16" fill="white" />
                </svg>
              </button>

              {showEmojiPicker && (
                <div className="emoji-picker" ref={emojiPickerRef}>
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => addEmoji(emoji)}
                      className="emoji-item"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
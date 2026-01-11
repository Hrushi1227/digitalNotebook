import {
  CheckCircleOutlined,
  CloseOutlined,
  MessageOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Badge, Button, Empty, Input } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../../firebaseService";
import { selectWorkerId } from "../../store/authSlice";
import { addMessage, selectWorkerMessages } from "../../store/messagesSlice";
import {
  chatStyles,
  formatChatTime,
  sortMessagesByActivity,
} from "../../utils/chat";

export default function WorkerFloatingChat({ worker, workerId: propWorkerId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const dispatch = useDispatch();
  const storeWorkerId = useSelector(selectWorkerId);
  const workerId = propWorkerId || storeWorkerId;

  // Use actual worker ID for filtering messages, not phone number
  const actualWorkerId = worker?.id || workerId;
  const allMessages = useSelector((s) => s.messages || []);
  const messages = useSelector((s) => selectWorkerMessages(s, actualWorkerId));

  // Debug logging
  useEffect(() => {
    console.log("WorkerFloatingChat Debug:", {
      workerId,
      propWorkerId,
      storeWorkerId,
      workerIdFromWorker: worker?.id,
      actualWorkerId,
      allMessagesCount: allMessages.length,
      filteredMessagesCount: messages.length,
      allMessages: allMessages,
      filteredMessages: messages,
    });
  }, [
    workerId,
    worker,
    allMessages,
    messages,
    propWorkerId,
    storeWorkerId,
    actualWorkerId,
  ]);

  // Sort messages by latest activity
  const sortedMessages = useMemo(
    () => sortMessagesByActivity(messages),
    [messages]
  );

  // Calculate unread count (only count messages with replies not viewed by worker)
  const unreadCount = useMemo(
    () => messages.filter((m) => m.reply && !m.workerViewed).length,
    [messages]
  );

  // Mark messages with replies as viewed when worker opens chat
  useEffect(() => {
    if (isOpen) {
      messages.forEach(async (msg) => {
        if (msg.reply && !msg.workerViewed) {
          try {
            await updateItem("messages", msg.id, { workerViewed: true });
            dispatch(addMessage({ ...msg, workerViewed: true }));
          } catch (e) {
            console.error("Error marking message as viewed:", e);
          }
        }
      });
    }
  }, [isOpen, messages, dispatch]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setSendingMessage(true);
    try {
      const newMessage = {
        workerId: actualWorkerId, // Use actual worker ID, not phone number
        workerName: worker?.name || workerId,
        message: messageText,
        isFromWorker: true,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore and get the document ID
      const docRef = await addItem("messages", newMessage);

      // Add to Redux with the actual Firestore document ID
      if (docRef && docRef.id) {
        dispatch(
          addMessage({
            ...newMessage,
            id: docRef.id,
          })
        );
      }

      setMessageText("");
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button - Hide when chat is open */}
      {!isOpen && (
        <div style={chatStyles.floatingButton}>
          <Badge count={unreadCount} offset={[-5, 5]}>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<MessageOutlined />}
              onClick={() => setIsOpen(true)}
              style={{
                ...chatStyles.buttonStyle,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            />
          </Badge>
        </div>
      )}

      {/* Chat Tray */}
      <div
        style={{
          ...chatStyles.trayContainer,
          width: isOpen ? "380px" : "0",
          maxWidth: "90vw",
          boxShadow: isOpen ? "2px 0 8px rgba(0,0,0,0.15)" : "none",
        }}
      >
        {isOpen && (
          <>
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                >
                  💬 Messages
                </div>
                <div style={{ fontSize: "12px", opacity: 0.9 }}>
                  Chat with owner
                </div>
              </div>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setIsOpen(false)}
                style={{ color: "#fff" }}
              />
            </div>

            {/* Messages Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
              {sortedMessages.length === 0 ? (
                <Empty
                  description="No messages yet"
                  style={{ marginTop: "60px" }}
                >
                  <p style={{ fontSize: "13px", color: "#999" }}>
                    Send a message to the owner below
                  </p>
                </Empty>
              ) : (
                <div>
                  {sortedMessages.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: "20px" }}>
                      {/* Worker's Message (Your message) */}
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                          padding: "12px 14px",
                          borderRadius: "12px 12px 12px 2px",
                          marginBottom: "8px",
                          borderLeft: "3px solid #1890ff",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            marginBottom: "6px",
                            fontWeight: "600",
                          }}
                        >
                          YOU
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#333",
                            marginBottom: "6px",
                          }}
                        >
                          {msg?.message || "No message text"}
                        </div>
                        <div style={chatStyles.timestamp}>
                          {formatChatTime(msg.timestamp)}
                        </div>
                      </div>

                      {/* Owner's Reply */}
                      {msg.reply && (
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
                            padding: "12px 14px",
                            borderRadius: "12px 12px 2px 12px",
                            marginLeft: "20px",
                            borderLeft: "3px solid #52c41a",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#52c41a",
                              marginBottom: "6px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircleOutlined />
                            OWNER'S REPLY
                          </div>
                          <div style={chatStyles.messageText}>{msg.reply}</div>
                          <div style={chatStyles.timestamp}>
                            {formatChatTime(msg.replyTime)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Send Message Input */}
            <div
              style={{
                padding: "16px",
                borderTop: "1px solid #f0f0f0",
                background: "#fafafa",
              }}
            >
              <div style={{ marginBottom: "12px" }}>
                <Input.TextArea
                  placeholder="Type your message to the owner..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  style={{ borderRadius: "8px" }}
                  disabled={sendingMessage}
                />
              </div>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={sendingMessage}
                disabled={!messageText.trim()}
                block
                size="large"
                style={{
                  borderRadius: "8px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                Send Message
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Overlay (when chat is open) */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} style={chatStyles.overlay} />
      )}
    </>
  );
}

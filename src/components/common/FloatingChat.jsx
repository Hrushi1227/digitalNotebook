import {
  CloseOutlined,
  MessageOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Button, Empty, Input, List, Space } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem } from "../../firebaseService";
import { addMessage, selectMessages } from "../../store/messagesSlice";
import { chatStyles, formatChatTime } from "../../utils/chat";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [replyTexts, setReplyTexts] = useState({}); // Changed to object to store reply per message
  const [replying, setReplying] = useState(false);

  const dispatch = useDispatch();
  const messages = useSelector(selectMessages);

  // Group messages by worker
  const groupedByWorker = useMemo(() => {
    const grouped = {};
    messages.forEach((msg) => {
      if (!grouped[msg.workerName]) {
        grouped[msg.workerName] = [];
      }
      grouped[msg.workerName].push(msg);
    });
    // Sort messages within each worker by timestamp (newest first)
    Object.keys(grouped).forEach((worker) => {
      grouped[worker].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    });
    return grouped;
  }, [messages]);

  // Calculate unread count (only count messages not viewed by admin)
  const unreadCount = useMemo(
    () => messages.filter((m) => !m.reply && !m.adminViewed).length,
    [messages]
  );

  // Mark messages as viewed when admin opens a worker's conversation
  useEffect(() => {
    if (selectedWorker && isOpen) {
      const workerMessages = groupedByWorker[selectedWorker] || [];
      workerMessages.forEach(async (msg) => {
        if (!msg.adminViewed && !msg.reply) {
          try {
            await updateItem("messages", msg.id, { adminViewed: true });
            dispatch(addMessage({ ...msg, adminViewed: true }));
          } catch (e) {
            console.error("Error marking message as viewed:", e);
          }
        }
      });
    }
  }, [selectedWorker, isOpen, groupedByWorker, dispatch]);

  const handleReply = async (messageId) => {
    const replyText = replyTexts[messageId];
    if (!replyText?.trim()) return;

    setReplying(true);
    try {
      // Check if message exists
      const message = messages.find((m) => m.id === messageId);
      if (!message) {
        console.error("Message not found:", messageId);
        return;
      }

      await updateItem("messages", messageId, {
        reply: replyText,
        replyTime: new Date().toISOString(),
      });

      dispatch(
        addMessage({
          ...message,
          reply: replyText,
          replyTime: new Date().toISOString(),
        })
      );

      // Clear this specific message's reply text
      setReplyTexts((prev) => {
        const updated = { ...prev };
        delete updated[messageId];
        return updated;
      });
    } catch (e) {
      console.error("Error replying to message:", e);
      if (e.code === "not-found") {
        console.error(
          "Message document doesn't exist in Firestore:",
          messageId
        );
      }
    } finally {
      setReplying(false);
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
              style={chatStyles.buttonStyle}
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
                background: "#1890ff",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space>
                <MessageOutlined style={{ fontSize: "20px" }} />
                <span style={{ fontSize: "18px", fontWeight: "600" }}>
                  Messages
                </span>
                {unreadCount > 0 && (
                  <Badge
                    count={unreadCount}
                    style={{ backgroundColor: "#52c41a" }}
                  />
                )}
              </Space>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsOpen(false);
                  setSelectedWorker(null);
                }}
                style={{ color: "#fff" }}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto" }}>
              {!selectedWorker ? (
                // Worker List
                <div>
                  {Object.keys(groupedByWorker).length === 0 ? (
                    <Empty
                      description="No messages yet"
                      style={{ marginTop: "60px" }}
                    />
                  ) : (
                    <List
                      dataSource={Object.keys(groupedByWorker)}
                      renderItem={(workerName) => {
                        const workerMsgs = groupedByWorker[workerName];
                        const unrepliedCount = workerMsgs.filter(
                          (m) => !m.reply && !m.adminViewed
                        ).length;
                        const lastMsg = workerMsgs[0];

                        return (
                          <List.Item
                            onClick={() => setSelectedWorker(workerName)}
                            style={{
                              cursor: "pointer",
                              padding: "12px 20px",
                              borderBottom: "1px solid #f0f0f0",
                              background:
                                unrepliedCount > 0 ? "#e6f7ff" : "#fff",
                            }}
                            className="hover:bg-gray-50"
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  style={{
                                    backgroundColor:
                                      unrepliedCount > 0 ? "#1890ff" : "#bbb",
                                  }}
                                  icon={<UserOutlined />}
                                />
                              }
                              title={
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <span style={{ fontWeight: "600" }}>
                                    {workerName}
                                  </span>
                                  {unrepliedCount > 0 && (
                                    <Badge
                                      count={unrepliedCount}
                                      style={{
                                        backgroundColor: "#ff4d4f",
                                        fontSize: "11px",
                                      }}
                                    />
                                  )}
                                </div>
                              }
                              description={
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#666",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {lastMsg?.message ? (
                                    <>
                                      {lastMsg.message.substring(0, 40)}
                                      {lastMsg.message.length > 40 ? "..." : ""}
                                    </>
                                  ) : (
                                    "No message"
                                  )}
                                  <span
                                    style={{ marginLeft: "8px", color: "#999" }}
                                  >
                                    · {formatChatTime(lastMsg.timestamp)}
                                  </span>
                                </div>
                              }
                            />
                          </List.Item>
                        );
                      }}
                    />
                  )}
                </div>
              ) : (
                // Conversation View
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  {/* Back Button + Worker Name */}
                  <div
                    style={{
                      padding: "12px 20px",
                      borderBottom: "1px solid #f0f0f0",
                      background: "#fafafa",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Button
                      type="text"
                      onClick={() => setSelectedWorker(null)}
                      size="small"
                    >
                      ← Back
                    </Button>
                    <Avatar
                      style={{ backgroundColor: "#1890ff" }}
                      icon={<UserOutlined />}
                      size="small"
                    />
                    <span style={{ fontWeight: "600", fontSize: "15px" }}>
                      {selectedWorker}
                    </span>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                    {groupedByWorker[selectedWorker]?.map((msg) => (
                      <div key={msg.id} style={{ marginBottom: "20px" }}>
                        {/* Worker Message */}
                        <div
                          style={{
                            background: "#f0f0f0",
                            padding: "10px 14px",
                            borderRadius: "12px",
                            marginBottom: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#333",
                              marginBottom: "4px",
                            }}
                          >
                            {msg?.message || "No message text"}
                          </div>
                          <div style={chatStyles.timestamp}>
                            {formatChatTime(msg.timestamp)}
                          </div>
                        </div>

                        {/* Admin Reply (if exists) */}
                        {msg.reply && (
                          <div style={chatStyles.messageBubbleReply}>
                            <div style={chatStyles.messageText}>
                              {msg.reply}
                            </div>
                            <div style={{ fontSize: "11px", opacity: 0.8 }}>
                              {formatChatTime(msg.replyTime)} · You
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Reply Input at Bottom (Facebook style) */}
                  {groupedByWorker[selectedWorker]?.some(
                    (msg) => !msg.reply
                  ) && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderTop: "1px solid #f0f0f0",
                        background: "#fff",
                      }}
                    >
                      {(() => {
                        const unrepliedMsg = groupedByWorker[
                          selectedWorker
                        ]?.find((msg) => !msg.reply);
                        if (!unrepliedMsg) return null;
                        return (
                          <Space.Compact style={{ width: "100%" }}>
                            <Input.TextArea
                              placeholder="Type your reply..."
                              value={replyTexts[unrepliedMsg.id] || ""}
                              onChange={(e) =>
                                setReplyTexts((prev) => ({
                                  ...prev,
                                  [unrepliedMsg.id]: e.target.value,
                                }))
                              }
                              onPressEnter={(e) => {
                                if (!e.shiftKey) {
                                  e.preventDefault();
                                  handleReply(unrepliedMsg.id);
                                }
                              }}
                              autoSize={{ minRows: 1, maxRows: 3 }}
                              style={{ borderRadius: "8px 0 0 8px" }}
                            />
                            <Button
                              type="primary"
                              icon={<SendOutlined />}
                              onClick={() => handleReply(unrepliedMsg.id)}
                              loading={replying}
                              disabled={!replyTexts[unrepliedMsg.id]?.trim()}
                              style={{
                                height: "auto",
                                borderRadius: "0 8px 8px 0",
                              }}
                            >
                              Send
                            </Button>
                          </Space.Compact>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Overlay (when chat is open) */}
      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false);
            setSelectedWorker(null);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            zIndex: 998,
          }}
        />
      )}
    </>
  );
}

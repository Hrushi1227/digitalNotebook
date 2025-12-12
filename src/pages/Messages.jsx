import { Button, Card, Form, Input, List, Modal, Tag } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem } from "../firebaseService";
import { addMessage, selectMessages } from "../store/messagesSlice";

export default function Messages() {
  const dispatch = useDispatch();
  const messages = useSelector(selectMessages);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || !replyTo) return;

    setReplying(true);
    try {
      // Add admin reply to the message
      await updateItem("messages", replyTo.id, {
        reply: replyText,
        replyTime: new Date().toISOString(),
      });

      // Also update in Redux
      dispatch(
        addMessage({
          ...replyTo,
          reply: replyText,
          replyTime: new Date().toISOString(),
        })
      );

      setReplyText("");
      setReplyTo(null);
    } catch (e) {
      console.error(e);
    } finally {
      setReplying(false);
    }
  };

  // Group messages by worker
  const groupedByWorker = {};
  messages.forEach((msg) => {
    if (!groupedByWorker[msg.workerName]) {
      groupedByWorker[msg.workerName] = [];
    }
    groupedByWorker[msg.workerName].push(msg);
  });

  return (
    <div>
      <Card title="Worker Messages" className="mb-6">
        <p className="text-gray-600 mb-4">
          View and respond to messages from your workers.
        </p>

        {Object.keys(groupedByWorker).length === 0 ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByWorker).map(([workerName, workerMsgs]) => (
              <Card
                key={workerName}
                title={workerName}
                type="inner"
                className="bg-blue-50"
              >
                <List
                  dataSource={workerMsgs}
                  renderItem={(msg) => (
                    <List.Item
                      key={msg.id}
                      className="border-b pb-3 mb-3 last:border-b-0"
                    >
                      <div className="w-full">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-gray-800 mb-2">{msg.message}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {new Date(msg.timestamp).toLocaleString()}
                              </span>
                              {msg.reply && <Tag color="green">Replied</Tag>}
                            </div>
                          </div>
                          {!msg.reply && (
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => setReplyTo(msg)}
                            >
                              Reply
                            </Button>
                          )}
                        </div>

                        {msg.reply && (
                          <div className="mt-3 p-3 bg-green-50 rounded border-l-4 border-green-400">
                            <p className="text-xs font-semibold text-green-800 mb-1">
                              Your Reply:
                            </p>
                            <p className="text-sm text-green-900">
                              {msg.reply}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {new Date(msg.replyTime).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Reply Modal */}
      <Modal
        title={`Reply to ${replyTo?.workerName}`}
        open={!!replyTo}
        onCancel={() => {
          setReplyTo(null);
          setReplyText("");
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setReplyTo(null);
              setReplyText("");
            }}
          >
            Cancel
          </Button>,
          <Button
            key="send"
            type="primary"
            loading={replying}
            onClick={handleReply}
            disabled={!replyText.trim()}
          >
            Send Reply
          </Button>,
        ]}
      >
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="text-xs text-gray-600 font-semibold mb-1">
            Original Message:
          </p>
          <p className="text-sm">{replyTo?.message}</p>
        </div>

        <Form layout="vertical">
          <Form.Item label="Your Reply">
            <Input.TextArea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder="Type your reply..."
              maxLength={500}
            />
          </Form.Item>
          <p className="text-xs text-gray-500">{replyText.length}/500</p>
        </Form>
      </Modal>
    </div>
  );
}

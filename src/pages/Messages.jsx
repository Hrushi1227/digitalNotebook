import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  MessageOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Row,
  Space,
  Statistic,
  Tag,
  Tooltip,
} from "antd";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem } from "../firebaseService";
import { addMessage, selectMessages } from "../store/messagesSlice";

export default function Messages() {
  const dispatch = useDispatch();
  const messages = useSelector(selectMessages);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

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

  // Calculate statistics
  const stats = useMemo(() => {
    const unreplied = messages.filter((m) => !m.reply).length;
    const replied = messages.filter((m) => m.reply).length;
    const totalWorkers = Object.keys(groupedByWorker).length;

    return {
      total: messages.length,
      unreplied,
      replied,
      totalWorkers,
    };
  }, [messages, groupedByWorker]);

  return (
    <div className="p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 px-2 sm:px-0">
        <MessageOutlined className="mr-2" />
        Messages & Communication
      </h1>

      {/* Statistics Dashboard */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Total Messages"
              value={stats.total}
              prefix={<CommentOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Pending Replies"
              value={stats.unreplied}
              prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Replied"
              value={stats.replied}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic
              title="Active Workers"
              value={stats.totalWorkers}
              prefix={<UserOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1", fontSize: "24px" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Messages Section */}
      <Card
        className="shadow-md"
        title={
          <Space>
            <MessageOutlined style={{ fontSize: "18px", color: "#1890ff" }} />
            <span style={{ fontSize: "16px", fontWeight: "600" }}>
              Worker Messages
            </span>
          </Space>
        }
      >
        {Object.keys(groupedByWorker).length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-gray-500">
                No messages yet. Messages from workers will appear here.
              </span>
            }
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByWorker).map(([workerName, workerMsgs]) => {
              const unrepliedCount = workerMsgs.filter((m) => !m.reply).length;

              return (
                <Card
                  key={workerName}
                  type="inner"
                  className="shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderLeft: "4px solid #1890ff" }}
                  title={
                    <Space>
                      <Avatar
                        style={{ backgroundColor: "#1890ff" }}
                        icon={<UserOutlined />}
                      />
                      <span style={{ fontSize: "15px", fontWeight: "600" }}>
                        {workerName}
                      </span>
                      <Badge
                        count={workerMsgs.length}
                        style={{ backgroundColor: "#52c41a" }}
                        showZero
                      />
                      {unrepliedCount > 0 && (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>
                          {unrepliedCount} Pending
                        </Tag>
                      )}
                    </Space>
                  }
                >
                  <List
                    dataSource={workerMsgs}
                    renderItem={(msg) => (
                      <List.Item
                        key={msg.id}
                        className="border-b border-gray-100 pb-4 mb-4 last:border-b-0 last:mb-0"
                      >
                        <div className="w-full">
                          {/* Original Message */}
                          <div
                            className="p-4 rounded-lg mb-3"
                            style={{
                              background:
                                "linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)",
                              borderLeft: "3px solid #1890ff",
                            }}
                          >
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1">
                                <Space className="mb-2">
                                  <CommentOutlined
                                    style={{ color: "#1890ff" }}
                                  />
                                  <span className="text-xs font-semibold text-gray-500">
                                    WORKER MESSAGE
                                  </span>
                                </Space>
                                <p className="text-gray-800 text-base mb-2">
                                  {msg.message}
                                </p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Tooltip title="Message received on">
                                    <span className="text-xs text-gray-500">
                                      <ClockCircleOutlined className="mr-1" />
                                      {new Date(msg.timestamp).toLocaleString(
                                        "en-IN",
                                        {
                                          dateStyle: "medium",
                                          timeStyle: "short",
                                        }
                                      )}
                                    </span>
                                  </Tooltip>
                                  {msg.reply ? (
                                    <Tag
                                      color="success"
                                      icon={<CheckCircleOutlined />}
                                    >
                                      Replied
                                    </Tag>
                                  ) : (
                                    <Tag
                                      color="warning"
                                      icon={<ClockCircleOutlined />}
                                    >
                                      Awaiting Reply
                                    </Tag>
                                  )}
                                </div>
                              </div>
                              {!msg.reply && (
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<SendOutlined />}
                                  onClick={() => setReplyTo(msg)}
                                >
                                  Reply
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Admin Reply */}
                          {msg.reply && (
                            <div
                              className="p-4 rounded-lg ml-6"
                              style={{
                                background:
                                  "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
                                borderLeft: "3px solid #52c41a",
                              }}
                            >
                              <Space className="mb-2">
                                <CheckCircleOutlined
                                  style={{ color: "#52c41a" }}
                                />
                                <span className="text-xs font-semibold text-green-700">
                                  YOUR REPLY
                                </span>
                              </Space>
                              <p className="text-gray-800 text-base mb-2">
                                {msg.reply}
                              </p>
                              <Tooltip title="Reply sent on">
                                <span className="text-xs text-green-600">
                                  <ClockCircleOutlined className="mr-1" />
                                  {new Date(msg.replyTime).toLocaleString(
                                    "en-IN",
                                    {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    }
                                  )}
                                </span>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* Reply Modal */}
      <Modal
        title={
          <Space>
            <Avatar
              style={{ backgroundColor: "#1890ff" }}
              icon={<UserOutlined />}
            />
            <span style={{ fontSize: "16px", fontWeight: "600" }}>
              Reply to {replyTo?.workerName}
            </span>
          </Space>
        }
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
            icon={<SendOutlined />}
            loading={replying}
            onClick={handleReply}
            disabled={!replyText.trim()}
          >
            Send Reply
          </Button>,
        ]}
        width={600}
      >
        <div
          className="mb-4 p-4 rounded-lg"
          style={{ background: "#f0f7ff", borderLeft: "3px solid #1890ff" }}
        >
          <Space className="mb-2">
            <CommentOutlined style={{ color: "#1890ff" }} />
            <span className="text-xs font-semibold text-gray-600">
              ORIGINAL MESSAGE
            </span>
          </Space>
          <p className="text-sm text-gray-800">{replyTo?.message}</p>
          <Divider style={{ margin: "12px 0" }} />
          <span className="text-xs text-gray-500">
            <ClockCircleOutlined className="mr-1" />
            Received:{" "}
            {replyTo?.timestamp &&
              new Date(replyTo.timestamp).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
          </span>
        </div>

        <Form layout="vertical">
          <Form.Item
            label={
              <span style={{ fontWeight: "600", fontSize: "14px" }}>
                Your Reply Message
              </span>
            }
          >
            <Input.TextArea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={5}
              placeholder="Type your reply message here... Be clear and professional."
              maxLength={500}
              showCount
              style={{ fontSize: "14px" }}
            />
          </Form.Item>
          <div className="text-xs text-gray-400 -mt-4">
            💡 Tip: Your reply will be sent to the worker and recorded in the
            system.
          </div>
        </Form>
      </Modal>
    </div>
  );
}

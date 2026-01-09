import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  List,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from "antd";
import html2canvas from "html2canvas";

import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addItem } from "../firebaseService";
import { logout, selectWorkerId } from "../store/authSlice";
import { selectDocuments } from "../store/documentsSlice";
import { addMessage, selectWorkerMessages } from "../store/messagesSlice";
import { selectPayments } from "../store/paymentsSlice";
import { selectTasks } from "../store/tasksSlice";
import { selectWorkers } from "../store/workersSlice";

export default function WorkerPortal() {
  const workerId = useSelector(selectWorkerId);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const paymentsData = useSelector(selectPayments);
  const tasksData = useSelector(selectTasks);
  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const workersData = useSelector(selectWorkers);
  const workers = Array.isArray(workersData) ? workersData : [];
  const messages = useSelector((s) => selectWorkerMessages(s, workerId));
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load documents
  const allDocuments = useSelector(selectDocuments);

  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Track when data is loaded from Firestore
  useEffect(() => {
    if (workers && workers.length > 0) {
      setDataLoaded(true);
    }
  }, [workers]);

  // Debug logs removed for production

  // Find worker with case-insensitive matching - more explicit
  let worker = null;
  if (workers && workers.length > 0) {
    for (const w of workers) {
      const wName = (w?.name || "").trim().toLowerCase();
      const wId = (w?.id || "").trim().toLowerCase();
      const wPhone = (w?.phone || "").trim().toLowerCase();
      const inputId = (workerId || "").trim().toLowerCase();

      if (wPhone === inputId) {
        worker = w;
        break;
      }
    }
  }

  // ✅ Filter documents AFTER worker is known
  const workerDocuments = allDocuments.filter((doc) => {
    if (doc.visibility === "public") return true;

    if (!worker) return false;

    return (
      Array.isArray(doc.assignedWorkers) &&
      doc.assignedWorkers.includes(worker.id)
    );
  });

  if (!worker) {
  }

  // Use worker's actual ID from database for filtering
  const actualWorkerId = worker?.id;

  const workerPayments = payments.filter(
    (p) =>
      p.workerId?.toLowerCase() === workerId?.toLowerCase() ||
      (actualWorkerId &&
        p.workerId?.toLowerCase() === actualWorkerId?.toLowerCase())
  );

  const workerTasks = tasks.filter(
    (t) =>
      t.workerId?.toLowerCase() === workerId?.toLowerCase() ||
      (actualWorkerId &&
        t.workerId?.toLowerCase() === actualWorkerId?.toLowerCase())
  );
  const completedTasks = workerTasks.filter(
    (t) => t.status === "completed"
  ).length;
  const totalEarned = workerPayments.reduce(
    (a, b) => a + Number(b.amount || 0),
    0
  );

  // Generate changes/updates report
  const generateChangesReport = () => {
    const changes = [];

    // Recent tasks (last 7 days)
    workerTasks.forEach((task) => {
      if (task.updatedAt) {
        const updateDate = new Date(task.updatedAt);
        const daysAgo = Math.floor(
          (new Date() - updateDate) / (1000 * 60 * 60 * 24)
        );
        if (daysAgo <= 7) {
          changes.push({
            id: `task-${task.id}`,
            type: "task",
            action: "Task Updated",
            description: `"${task.title}" - Status: ${task.status}`,
            date: updateDate,
            daysAgo,
          });
        }
      }
    });

    // Recent payments (last 30 days)
    workerPayments.forEach((payment) => {
      if (payment.createdAt) {
        const paymentDate = new Date(payment.createdAt);
        const daysAgo = Math.floor(
          (new Date() - paymentDate) / (1000 * 60 * 60 * 24)
        );
        if (daysAgo <= 30) {
          changes.push({
            id: `payment-${payment.id}`,
            type: "payment",
            action: "Payment Added",
            description: `₹${payment.amount} - ${payment.note || "Payment"}`,
            date: paymentDate,
            daysAgo,
          });
        }
      }
    });

    // Sort by date (newest first)
    return changes.sort((a, b) => b.date - a.date);
  };

  const changesReport = generateChangesReport();

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setSendingMessage(true);
    try {
      await addItem("messages", {
        workerId: worker?.id || workerId,
        workerName: worker?.name || workerId,
        message: messageText,
        isFromWorker: true,
        timestamp: new Date().toISOString(),
      });
      dispatch(
        addMessage({
          workerId: worker?.id || workerId,
          workerName: worker?.name || workerId,
          message: messageText,
          isFromWorker: true,
          timestamp: new Date().toISOString(),
        })
      );
      setMessageText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const downloadPaymentPDF = async () => {
    try {
      const element = document.getElementById("payment-history-pdf");
      if (!element) return;

      // Clone the element so we can expand it to full content width for capture
      const clone = element.cloneNode(true);
      // Compute full scroll width so table is not truncated
      const fullWidth = element.scrollWidth || element.offsetWidth || 1000;
      clone.style.width = fullWidth + "px";
      clone.style.position = "fixed";
      clone.style.left = "-10000px";
      clone.style.top = "0";
      clone.style.overflow = "visible";
      clone.style.background = "#ffffff";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: fullWidth,
        windowWidth: fullWidth,
      });

      // remove the clone after capture
      document.body.removeChild(clone);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`payment-history-${worker?.name || workerId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Professional Header */}
      <div
        className="shadow-md mb-6"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "24px",
          color: "white",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                👋 Welcome, {worker?.name || workerId}
              </h1>
              <p className="opacity-90 text-base">
                Your Personal Work Portal - View payments, documents &
                communicate
              </p>
            </div>
            <Button
              danger
              size="large"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ minWidth: "120px" }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Worker Profile Card - Only show if worker is registered */}
        {worker && (
          <Card
            className="mb-6 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              borderRadius: "12px",
              border: "none",
            }}
          >
            <Row align="middle" gutter={[16, 16]}>
              <Col xs={24} sm={4} md={3} className="text-center sm:text-left">
                <Avatar
                  size={80}
                  style={{
                    backgroundColor: "#667eea",
                    fontSize: "32px",
                    fontWeight: "bold",
                  }}
                >
                  {worker.name?.charAt(0)?.toUpperCase()}
                </Avatar>
              </Col>
              <Col xs={24} sm={14} md={15}>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                  {worker.name}
                </h2>
                {worker.profession && (
                  <Tag
                    color="blue"
                    style={{ fontSize: "14px", padding: "4px 12px" }}
                  >
                    <UserOutlined className="mr-1" />
                    {worker.profession}
                  </Tag>
                )}
                <div className="mt-3 text-gray-700">
                  <div className="mb-1">
                    📱 <strong>Phone:</strong> +91{worker.phone || "—"}
                  </div>
                  <div>
                    💼 <strong>Daily Rate:</strong> ₹{worker.rate || "—"}/day
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={6} md={6} className="text-center sm:text-right">
                <div className="bg-white bg-opacity-70 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Worker ID</div>
                  <div className="text-sm font-mono font-bold text-gray-800 break-all">
                    {worker.id}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Stats - Only show if worker is registered */}
        {worker && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card
                className="shadow-md hover:shadow-xl transition-shadow"
                style={{ borderRadius: "12px" }}
              >
                <Statistic
                  title={
                    <span style={{ fontSize: "16px" }}>
                      <WalletOutlined /> Total Earned
                    </span>
                  }
                  value={totalEarned}
                  prefix="₹"
                  valueStyle={{
                    color: "#52c41a",
                    fontSize: "28px",
                    fontWeight: "bold",
                  }}
                  suffix={
                    <div className="text-sm text-gray-500">
                      {workerPayments.length} payments
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                className="shadow-md hover:shadow-xl transition-shadow"
                style={{ borderRadius: "12px" }}
              >
                <Statistic
                  title={
                    <span style={{ fontSize: "16px" }}>
                      <FileTextOutlined /> Tasks Assigned
                    </span>
                  }
                  value={workerTasks.length}
                  valueStyle={{
                    color: "#1890ff",
                    fontSize: "28px",
                    fontWeight: "bold",
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                className="shadow-md hover:shadow-xl transition-shadow"
                style={{ borderRadius: "12px" }}
              >
                <Statistic
                  title={
                    <span style={{ fontSize: "16px" }}>
                      <CheckCircleOutlined /> Completed Tasks
                    </span>
                  }
                  value={completedTasks}
                  suffix={`/ ${workerTasks.length}`}
                  valueStyle={{
                    color: "#faad14",
                    fontSize: "28px",
                    fontWeight: "bold",
                  }}
                />
              </Card>
            </Col>
          </Row>
        )}
        {/* Payment History - Only show if worker is registered */}
        {worker ? (
          <Card
            title={
              <Space>
                <WalletOutlined
                  style={{ fontSize: "20px", color: "#52c41a" }}
                />
                <span style={{ fontSize: "18px", fontWeight: "600" }}>
                  Payment History
                </span>
                <Badge
                  count={workerPayments.length}
                  style={{ backgroundColor: "#52c41a" }}
                />
              </Space>
            }
            className="mb-6 shadow-lg"
            style={{ borderRadius: "12px" }}
            extra={
              <Tooltip title="Download payment history as PDF">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={downloadPaymentPDF}
                  disabled={workerPayments.length === 0}
                  size="large"
                  style={{ borderRadius: "8px" }}
                >
                  <span className="hidden sm:inline">Download PDF</span>
                </Button>
              </Tooltip>
            }
          >
            <div
              id="payment-history-pdf"
              className="bg-white p-4 sm:p-6"
              style={{ borderRadius: "8px" }}
            >
              {/* PDF Header with Worker Details */}
              <div
                className="mb-6 pb-4 border-b-2"
                style={{ borderColor: "#667eea" }}
              >
                <Row align="middle" gutter={[16, 16]}>
                  <Col flex="auto">
                    <h2
                      className="text-2xl font-bold mb-2"
                      style={{ color: "#667eea" }}
                    >
                      Payment Statement
                    </h2>
                    <div className="text-base text-gray-700">
                      <div className="mb-1">
                        <strong>Name:</strong> {worker.name}
                      </div>
                      <div className="mb-1">
                        <strong>Phone:</strong> +91{worker.phone}
                      </div>
                      <div className="mb-1">
                        <strong>Profession:</strong> {worker.profession || "—"}
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">
                        Total Amount Paid
                      </div>
                      <div
                        className="text-3xl font-bold"
                        style={{ color: "#52c41a" }}
                      >
                        ₹{totalEarned.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Generated: {new Date().toLocaleDateString("en-IN")}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Payment Table */}
              {workerPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table
                    rowKey="id"
                    dataSource={workerPayments}
                    columns={[
                      {
                        title: "Sr. No.",
                        render: (_, __, index) => index + 1,
                        width: 80,
                      },
                      {
                        title: "Payment Date",
                        dataIndex: "date",
                        render: (date) => (
                          <Space>
                            <CalendarOutlined style={{ color: "#1890ff" }} />
                            {date}
                          </Space>
                        ),
                      },
                      {
                        title: "Amount Paid",
                        dataIndex: "amount",
                        render: (v) => (
                          <span
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#52c41a",
                            }}
                          >
                            ₹{Number(v).toLocaleString()}
                          </span>
                        ),
                      },
                      {
                        title: "Description / Note",
                        dataIndex: "note",
                        render: (note) => note || "—",
                      },
                    ]}
                    summary={() => (
                      <Table.Summary>
                        <Table.Summary.Row style={{ background: "#f0f7ff" }}>
                          <Table.Summary.Cell
                            index={0}
                            colSpan={2}
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              fontSize: "16px",
                            }}
                          >
                            TOTAL PAID
                          </Table.Summary.Cell>
                          <Table.Summary.Cell
                            index={2}
                            colSpan={2}
                            style={{
                              fontWeight: 700,
                              fontSize: "18px",
                              color: "#52c41a",
                            }}
                          >
                            ₹{totalEarned.toLocaleString()}
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                    scroll={{ x: "max-content" }}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    bordered
                  />
                </div>
              ) : (
                <Empty
                  description="No payments received yet"
                  style={{ margin: "40px 0" }}
                />
              )}
            </div>
          </Card>
        ) : null}
        {/* Public Documents Section */}
        {worker && (
          <Card
            title={
              <Space>
                <FileTextOutlined
                  style={{ fontSize: "20px", color: "#1890ff" }}
                />
                <span style={{ fontSize: "18px", fontWeight: "600" }}>
                  Documents & Files
                </span>
                <Badge
                  count={workerDocuments.length}
                  style={{ backgroundColor: "#1890ff" }}
                />
              </Space>
            }
            className="mb-6 shadow-lg"
            style={{ borderRadius: "12px" }}
          >
            {workerDocuments.length > 0 ? (
              <List
                dataSource={workerDocuments}
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                renderItem={(record) => (
                  <List.Item>
                    <Card
                      hoverable
                      className="shadow-sm"
                      style={{ borderRadius: "8px", height: "100%" }}
                      cover={
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            height: "120px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "8px 8px 0 0",
                          }}
                        >
                          <FileTextOutlined
                            style={{ fontSize: "48px", color: "white" }}
                          />
                        </div>
                      }
                    >
                      <Card.Meta
                        title={
                          <Tooltip title={record.name}>
                            <div className="truncate">{record.name}</div>
                          </Tooltip>
                        }
                        description={
                          <div>
                            <Tag color="blue" style={{ marginBottom: "8px" }}>
                              {record.fileType}
                            </Tag>
                            <div>
                              <Space size="small">
                                <Tooltip title="Preview document">
                                  <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => {
                                      setPreviewDoc(record);
                                      setPreviewOpen(true);
                                    }}
                                  >
                                    Preview
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Download document">
                                  <Button
                                    size="small"
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    onClick={() => {
                                      if (!record.dataUrl) {
                                        return;
                                      }
                                      const isIOS = /iPhone|iPad|iPod/i.test(
                                        navigator.userAgent
                                      );
                                      if (isIOS) {
                                        window.open(record.dataUrl, "_blank");
                                      } else {
                                        const link =
                                          document.createElement("a");
                                        link.href = record.dataUrl;
                                        link.download = record.name;
                                        link.click();
                                      }
                                    }}
                                  >
                                    Download
                                  </Button>
                                </Tooltip>
                              </Space>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No documents available yet"
                style={{ margin: "40px 0" }}
              />
            )}
          </Card>
        )}
        {/* Tasks - Only show if worker is registered */}
        {worker && workerTasks.length > 0 && (
          <Card
            title={
              <Space>
                <CheckCircleOutlined
                  style={{ fontSize: "20px", color: "#faad14" }}
                />
                <span style={{ fontSize: "18px", fontWeight: "600" }}>
                  Your Tasks
                </span>
                <Badge
                  count={workerTasks.length}
                  style={{ backgroundColor: "#faad14" }}
                />
              </Space>
            }
            className="mb-6 shadow-lg"
            style={{ borderRadius: "12px" }}
          >
            <List
              dataSource={workerTasks}
              renderItem={(task) => (
                <List.Item>
                  <Card
                    size="small"
                    className="w-full"
                    style={{
                      borderLeft: `4px solid ${
                        task.status === "completed" ? "#52c41a" : "#faad14"
                      }`,
                      borderRadius: "8px",
                    }}
                  >
                    <Row align="middle" gutter={[16, 8]}>
                      <Col flex="auto">
                        <div className="font-semibold text-base mb-1">
                          {task.title}
                        </div>
                        {task.deadline && (
                          <div className="text-sm text-gray-500">
                            <CalendarOutlined className="mr-1" />
                            Deadline: {task.deadline}
                          </div>
                        )}
                      </Col>
                      <Col>
                        {task.status === "completed" ? (
                          <Tag
                            color="success"
                            icon={<CheckCircleOutlined />}
                            style={{ fontSize: "14px", padding: "4px 12px" }}
                          >
                            Completed
                          </Tag>
                        ) : (
                          <Tag
                            color="warning"
                            icon={<ClockCircleOutlined />}
                            style={{ fontSize: "14px", padding: "4px 12px" }}
                          >
                            Pending
                          </Tag>
                        )}
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Messages - Only show if worker is registered */}
        {worker ? (
          <Card
            title={
              <Space>
                <MessageOutlined
                  style={{ fontSize: "20px", color: "#722ed1" }}
                />
                <span style={{ fontSize: "18px", fontWeight: "600" }}>
                  Messages
                </span>
                <Badge
                  count={messages.length}
                  style={{ backgroundColor: "#722ed1" }}
                />
              </Space>
            }
            className="shadow-lg"
            style={{ borderRadius: "12px" }}
          >
            <div className="mb-4 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              {messages.length > 0 ? (
                <List
                  dataSource={messages}
                  renderItem={(msg) => (
                    <List.Item style={{ border: "none", padding: "12px 0" }}>
                      <Card
                        size="small"
                        className="w-full shadow-sm"
                        style={{ borderRadius: "8px" }}
                      >
                        <div
                          className="mb-2 p-3 rounded"
                          style={{
                            background:
                              "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                            borderLeft: "3px solid #1890ff",
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-gray-500 font-semibold">
                              YOUR MESSAGE
                            </span>
                            <span className="text-xs text-gray-500">
                              <CalendarOutlined className="mr-1" />
                              {new Date(msg.timestamp).toLocaleDateString(
                                "en-IN",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }
                              )}
                            </span>
                          </div>
                          <div className="text-gray-800">{msg.message}</div>
                        </div>
                        {msg.reply && (
                          <div
                            className="p-3 rounded"
                            style={{
                              background:
                                "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
                              borderLeft: "3px solid #52c41a",
                            }}
                          >
                            <div className="flex items-center mb-2">
                              <CheckCircleOutlined
                                style={{ color: "#52c41a", marginRight: "8px" }}
                              />
                              <span className="text-xs text-green-700 font-semibold">
                                OWNER'S REPLY
                              </span>
                            </div>
                            <div className="text-gray-800">{msg.reply}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              <CalendarOutlined className="mr-1" />
                              {new Date(msg.replyTime).toLocaleDateString(
                                "en-IN",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No messages yet"
                  style={{ margin: "20px 0" }}
                />
              )}
            </div>

            <Divider style={{ margin: "16px 0" }}>Send New Message</Divider>

            <Space.Compact style={{ width: "100%" }} size="large">
              <Input
                placeholder="Type your message to the owner..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onPressEnter={handleSendMessage}
                disabled={sendingMessage}
                size="large"
                style={{ borderRadius: "8px 0 0 8px" }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={sendingMessage}
                disabled={!messageText.trim()}
                size="large"
                style={{ borderRadius: "0 8px 8px 0", minWidth: "100px" }}
              >
                Send
              </Button>
            </Space.Compact>
          </Card>
        ) : (
          <Card
            className="border-orange-200 bg-orange-50 shadow-lg"
            style={{ borderRadius: "12px" }}
          >
            <Empty
              description="Worker Profile Not Found"
              style={{ marginTop: 40, marginBottom: 40 }}
            >
              <p className="text-orange-700 text-center font-semibold text-lg">
                Your worker ID "{workerId}" is not registered in the system.
              </p>
              <p className="text-orange-600 text-center text-sm mt-2">
                Please contact the admin to add your profile to the workers
                list.
              </p>
            </Empty>
          </Card>
        )}
        <Modal
          open={previewOpen}
          title={
            <Space>
              <FileTextOutlined style={{ color: "#1890ff" }} />
              <span
                style={{
                  fontWeight: "600",
                  fontSize: window.innerWidth > 768 ? "16px" : "14px",
                }}
              >
                {previewDoc?.name}
              </span>
            </Space>
          }
          footer={[
            <Button
              key="close"
              onClick={() => setPreviewOpen(false)}
              size="large"
              style={{ width: window.innerWidth <= 768 ? "100%" : "auto" }}
            >
              Close
            </Button>,
            <Button
              key="download"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => {
                if (!previewDoc?.dataUrl) return;
                const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isIOS) {
                  window.open(previewDoc.dataUrl, "_blank");
                } else {
                  const link = document.createElement("a");
                  link.href = previewDoc.dataUrl;
                  link.download = previewDoc.name;
                  link.click();
                }
              }}
              size="large"
              style={{
                width: window.innerWidth <= 768 ? "100%" : "auto",
                marginTop: window.innerWidth <= 768 ? "8px" : "0",
              }}
            >
              Download
            </Button>,
          ]}
          onCancel={() => setPreviewOpen(false)}
          width="100%"
          style={{
            top: window.innerWidth > 768 ? 20 : 0,
            paddingBottom: 0,
            maxWidth: window.innerWidth > 768 ? "900px" : "100vw",
          }}
          bodyStyle={{
            maxHeight: window.innerWidth > 768 ? "80vh" : "75vh",
            overflowY: "auto",
            overflowX: "hidden",
            padding: window.innerWidth > 768 ? "24px" : "12px",
            WebkitOverflowScrolling: "touch",
          }}
          centered={window.innerWidth > 768}
        >
          {previewDoc && (
            <div
              className="bg-gray-50 rounded-lg"
              style={{ padding: window.innerWidth > 768 ? "16px" : "8px" }}
            >
              {previewDoc.fileType === "Image" ? (
                <div
                  style={{
                    width: "100%",
                    overflow: window.innerWidth <= 768 ? "auto" : "hidden",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <img
                    src={previewDoc.dataUrl}
                    alt={previewDoc.name}
                    style={{
                      maxWidth: "100%",
                      width: window.innerWidth <= 768 ? "auto" : "100%",
                      height: "auto",
                      display: "block",
                      margin: "0 auto",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      touchAction: "pan-x pan-y pinch-zoom",
                      cursor: window.innerWidth <= 768 ? "pointer" : "default",
                    }}
                    onClick={() => {
                      // Open in new tab for better zoom control on mobile
                      if (window.innerWidth <= 768) {
                        window.open(previewDoc.dataUrl, "_blank");
                      }
                    }}
                  />
                  {window.innerWidth <= 768 && (
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: "12px",
                        padding: "8px",
                        background: "#e6f7ff",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#1890ff",
                      }}
                    >
                      💡 Tap image to open in full screen for zoom
                    </div>
                  )}
                </div>
              ) : previewDoc.fileType === "PDF" ? (
                <div style={{ width: "100%" }}>
                  <iframe
                    src={previewDoc.dataUrl}
                    title={previewDoc.name}
                    style={{
                      width: "100%",
                      height: window.innerWidth > 768 ? "600px" : "60vh",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  {window.innerWidth <= 768 && (
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: "12px",
                        padding: "8px",
                        background: "#fff7e6",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#d46b08",
                      }}
                    >
                      ⚠️ For better PDF viewing, use the Download button
                    </div>
                  )}
                </div>
              ) : (
                <Empty
                  description="Preview not available for this file type. Please download to view."
                  style={{ margin: "60px 0" }}
                />
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

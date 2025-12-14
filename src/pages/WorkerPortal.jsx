import { DownloadOutlined, InfoCircleOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Popover,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
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
  const payments = useSelector(selectPayments);
  const tasks = useSelector(selectTasks);
  const workersData = useSelector(selectWorkers);
  const workers = Array.isArray(workersData) ? workersData : [];
  const messages = useSelector((s) => selectWorkerMessages(s, workerId));

  // Load documents
  const allDocuments = useSelector(selectDocuments);

  // Workers see only PUBLIC documents
  const publicDocuments = allDocuments.filter(
    (doc) => doc.visibility === "public"
  );

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

      if (wName === inputId || wId === inputId || wPhone === inputId) {
        worker = w;
        break;
      }
    }
  }

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
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, {worker?.name || workerId}
          </h1>
          <p className="text-gray-600">Your Work Portal</p>
        </div>
        <Space>
          <Button onClick={() => navigate("/")} type="default">
            Back to Admin Portal
          </Button>
          <Button danger onClick={handleLogout}>
            Logout
          </Button>
        </Space>
      </div>

      {/* Worker Profile Card - Only show if worker is registered */}
      {worker && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-1">
                {worker.name}
              </h2>
              <p className="text-blue-800 text-base sm:text-lg">
                📱 <span className="font-semibold">{worker.phone || "—"}</span>
              </p>
              {worker.profession && (
                <p className="text-blue-700 mt-1 text-sm">
                  Role: {worker.profession}
                </p>
              )}
            </div>
            <div className="text-right w-full sm:w-auto">
              <p className="text-sm text-blue-600">Worker ID</p>
              <p className="text-base sm:text-lg font-mono font-bold text-blue-900 break-words">
                {worker.id}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats - Only show if worker is registered */}
      {worker && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Total Earned"
                value={totalEarned}
                prefix="₹"
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Tasks Assigned"
                value={workerTasks.length}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Tasks Completed"
                value={completedTasks}
                suffix={`/ ${workerTasks.length}`}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Changes/Updates Report - Only show if worker is registered */}
      {worker ? (
        <Card
          title={
            <Space>
              <span>Recent Changes & Updates</span>
              <Popover
                content="Shows recent updates to your tasks and payments made by the owner"
                title="What is this?"
                trigger="hover"
              >
                <InfoCircleOutlined
                  style={{ cursor: "pointer", color: "#1890ff" }}
                />
              </Popover>
            </Space>
          }
          className="mb-6"
        >
          {changesReport.length > 0 ? (
            <Timeline
              items={changesReport.map((change) => ({
                color:
                  change.type === "task"
                    ? "#1890ff"
                    : change.type === "payment"
                    ? "#52c41a"
                    : "gray",
                children: (
                  <div>
                    <p className="font-semibold text-gray-800">
                      {change.action}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {change.description}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {change.date.toLocaleDateString()} (
                      {change.daysAgo === 0
                        ? "Today"
                        : change.daysAgo === 1
                        ? "Yesterday"
                        : `${change.daysAgo} days ago`}
                      )
                    </p>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty
              description="No recent changes"
              style={{ marginTop: 40, marginBottom: 40 }}
            />
          )}
        </Card>
      ) : (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <Empty
            description="Worker Profile Not Found"
            style={{ marginTop: 40, marginBottom: 40 }}
          >
            <p className="text-orange-700 text-center font-semibold">
              Your worker ID "{workerId}" is not registered in the admin system.
            </p>
            <p className="text-orange-600 text-center text-sm mt-2">
              The system matches your login ID with the worker NAME from the
              admin's Workers list.
            </p>

            {workers && workers.length > 0 ? (
              <div className="mt-6 p-4 bg-white rounded border border-orange-300">
                <p className="text-orange-800 font-semibold text-center mb-3">
                  Login with Name or Phone Number:
                </p>
                <div className="space-y-2">
                  {workers.map((w) => (
                    <div
                      key={w.id}
                      className="bg-orange-50 p-3 rounded border border-orange-200 text-center"
                    >
                      <div className="text-orange-900 font-medium">
                        {w.name}
                      </div>
                      {w.phone && (
                        <div className="text-orange-700 text-sm">
                          📱 {w.phone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-orange-600 text-xs text-center mt-3">
                  Use the name or phone number above to login
                </p>
              </div>
            ) : (
              <p className="text-orange-600 text-center text-sm mt-3">
                No workers registered yet. Please ask the owner to add you to
                the workers list.
              </p>
            )}
          </Empty>
        </Card>
      )}
      {/* Payment History - Only show if worker is registered */}
      {worker ? (
        <Card
          title="Your Payment History"
          className="mb-6"
          extra={
            <div className="w-full sm:w-auto">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={downloadPaymentPDF}
                disabled={workerPayments.length === 0}
                className="w-full sm:w-auto"
                size="middle"
              >
                Download PDF
              </Button>
            </div>
          }
        >
          <div id="payment-history-pdf" className="bg-white p-4 sm:p-6">
            {/* PDF Header with Worker Details */}
            <div className="mb-6 pb-4 border-b-2 border-gray-300">
              <h2 className="text-2xl font-bold mb-2">{worker.name}</h2>
              <p className="text-lg text-gray-700">📱 Mobile: {worker.phone}</p>
              <p className="text-lg text-gray-800 font-semibold mt-2">
                Total Paid: ₹{totalEarned}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Generated on: {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Payment Table */}
            {workerPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table
                  rowKey="id"
                  dataSource={workerPayments}
                  columns={[
                    {
                      title: "Amount",
                      dataIndex: "amount",
                      render: (v) => `₹${v}`,
                    },
                    { title: "Date", dataIndex: "date" },
                    { title: "Note", dataIndex: "note" },
                  ]}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell
                          index={0}
                          colSpan={2}
                          style={{ textAlign: "right", fontWeight: 700 }}
                        >
                          Total Paid
                        </Table.Summary.Cell>
                        <Table.Summary.Cell
                          index={2}
                          style={{ fontWeight: 700 }}
                        >
                          ₹{totalEarned}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                  scroll={{ x: "max-content" }}
                  pagination={false}
                  bordered
                />
              </div>
            ) : (
              <p className="text-gray-500">No payments yet.</p>
            )}
          </div>
        </Card>
      ) : null}

      {/* Tasks - Only show if worker is registered */}
      {worker ? (
        <Card title="Your Tasks" className="mb-6">
          {workerTasks.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <Table
                rowKey="id"
                dataSource={workerTasks}
                columns={[
                  { title: "Task", dataIndex: "title" },
                  {
                    title: "Status",
                    dataIndex: "status",
                    render: (s) =>
                      s === "completed" ? (
                        <Tag color="green">Completed</Tag>
                      ) : (
                        <Tag color="orange">Pending</Tag>
                      ),
                  },
                  { title: "Deadline", dataIndex: "deadline" },
                ]}
                scroll={{ x: "max-content" }}
                pagination={false}
              />
            </div>
          ) : (
            <p className="text-gray-500">No tasks assigned yet.</p>
          )}
        </Card>
      ) : null}
      {/* Public Documents Section */}
      {worker && (
        <Card title="Documents" className="mb-6">
          {publicDocuments.length > 0 ? (
            <Table
              rowKey="id"
              dataSource={publicDocuments}
              columns={[
                {
                  title: "File",
                  dataIndex: "name",
                },
                {
                  title: "Type",
                  dataIndex: "fileType",
                  render: (t) => <Tag>{t}</Tag>,
                },
                {
                  title: "Download",
                  render: (_, record) => (
                    <Button
                      type="primary"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = record.dataUrl;
                        link.download = record.name;
                        link.click();
                      }}
                    >
                      Download
                    </Button>
                  ),
                },
              ]}
              pagination={false}
            />
          ) : (
            <p className="text-gray-500">No public documents available.</p>
          )}
        </Card>
      )}

      {/* Messages - Only show if worker is registered */}
      {worker ? (
        <Card title="Messages to Owner">
          <div className="mb-4 max-h-96 overflow-y-auto border rounded p-3 bg-gray-50">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="mb-3 pb-3 border-b last:border-b-0"
                >
                  <p className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-sm">{msg.message}</p>
                  {msg.reply && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <p className="text-xs font-semibold text-blue-800">
                        Owner's Reply:
                      </p>
                      <p className="text-sm text-blue-900">{msg.reply}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No messages yet.</p>
            )}
          </div>

          <Space.Compact style={{ width: "100%" }} className="flex">
            <Input
              placeholder="Send a message to the owner..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onPressEnter={handleSendMessage}
              disabled={sendingMessage}
            />
            <Button
              type="primary"
              onClick={handleSendMessage}
              loading={sendingMessage}
            >
              Send
            </Button>
          </Space.Compact>
        </Card>
      ) : null}
    </div>
  );
}

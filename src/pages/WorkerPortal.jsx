import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Empty,
  Popover,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addItem } from "../firebaseService";
import { logout, selectWorkerId } from "../store/authSlice";
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
  const workers = useSelector(selectWorkers);
  const messages = useSelector((s) => selectWorkerMessages(s, workerId));

  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const worker = workers.find((w) => w.id === workerId || w.name === workerId);
  const workerPayments = payments.filter(
    (p) => p.workerId === workerId || p.workerId === worker?.id
  );
  const workerTasks = tasks.filter(
    (t) => t.workerId === workerId || t.workerId === worker?.id
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

      {/* Stats */}
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

      {/* Changes/Updates Report */}
      <Card 
        title={
          <Space>
            <span>Recent Changes & Updates</span>
            <Popover
              content="Shows recent updates to your tasks and payments made by the owner"
              title="What is this?"
              trigger="hover"
            >
              <InfoCircleOutlined style={{ cursor: "pointer", color: "#1890ff" }} />
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
                  <p className="text-gray-600 text-sm">{change.description}</p>
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
      <Card title="Your Payment History" className="mb-6">
        {workerPayments.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
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
              scroll={{ x: "max-content" }}
              pagination={false}
            />
          </div>
        ) : (
          <p className="text-gray-500">No payments yet.</p>
        )}
      </Card>

      {/* Tasks */}
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

      {/* Messages */}
      <Card title="Messages to Owner">
        <div className="mb-4 max-h-96 overflow-y-auto border rounded p-3 bg-gray-50">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="mb-3 pb-3 border-b last:border-b-0">
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
    </div>
  );
}

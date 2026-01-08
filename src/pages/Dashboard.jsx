import { FileTextOutlined } from "@ant-design/icons";
import {
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { selectDocuments } from "../store/documentsSlice";
import { selectMaterials } from "../store/materialsSlice";
import { selectPayments } from "../store/paymentsSlice";
import { selectWorkers } from "../store/workersSlice";

export default function Dashboard() {
  const materials = useSelector(selectMaterials);
  const payments = useSelector(selectPayments);
  const workers = useSelector(selectWorkers);
  const documents = useSelector(selectDocuments);

  /* ---------------- CALCULATIONS ---------------- */

  const materialSpend = materials.reduce(
    (sum, m) => sum + Number(m.price || 0),
    0
  );

  const laborSpend = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const totalSpend = materialSpend + laborSpend;

  // Count workers who have received at least one payment
  const activeWorkers = workers.filter((w) =>
    payments.some((p) => p.workerId === w.id)
  ).length;

  /* -------- TOP MATERIAL CATEGORIES -------- */

  const materialByCategory = Object.values(
    materials.reduce((acc, m) => {
      const key = m.category || "Other";
      acc[key] = acc[key] || { category: key, amount: 0, items: 0, qty: 0 };
      acc[key].amount += Number(m.price || 0);
      acc[key].items += 1;
      acc[key].qty += Number(m.qty || 0);
      return acc;
    }, {})
  ).sort((a, b) => b.amount - a.amount);

  /* -------- TOP PAID WORKERS -------- */

  const workerPayments = Object.values(
    payments.reduce((acc, p) => {
      acc[p.workerId] = acc[p.workerId] || {
        workerId: p.workerId,
        amount: 0,
        paymentCount: 0,
      };
      acc[p.workerId].amount += Number(p.amount || 0);
      acc[p.workerId].paymentCount += 1;
      return acc;
    }, {})
  )
    .map((w) => {
      const worker = workers.find((x) => x.id === w.workerId);
      return {
        ...w,
        name: worker?.name || "Unknown",
        profession: worker?.profession || "-",
        dailyRate: worker?.rate || 0,
        utilizationPercent:
          w.amount > 0 ? Math.round((w.amount / laborSpend) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  /* -------- RECENT PAYMENTS -------- */
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .map((p) => ({
      ...p,
      workerName: workers.find((w) => w.id === p.workerId)?.name || "Unknown",
    }));

  /* ---------------- TABLE COLUMNS ---------------- */

  const materialColumns = [
    { title: "Category", dataIndex: "category" },
    { title: "Items", dataIndex: "items" },
    { title: "Total Qty", dataIndex: "qty", render: (v) => <b>{v}</b> },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (v) => `₹${v.toLocaleString()}`,
    },
    {
      title: "% of Materials",
      render: (_, record) => {
        const percent =
          materialSpend > 0
            ? Math.round((record.amount / materialSpend) * 100)
            : 0;
        return <Progress percent={percent} size="small" />;
      },
    },
  ];

  const workerColumns = [
    {
      title: "Worker",
      dataIndex: "name",
      render: (name, record) => (
        <Link
          to={`/workers/${record.workerId}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {name}
        </Link>
      ),
    },
    { title: "Profession", dataIndex: "profession" },
    { title: "Daily Rate", dataIndex: "dailyRate", render: (v) => `₹${v}` },
    {
      title: "Payments",
      dataIndex: "paymentCount",
      render: (count, record) => {
        const workerPaymentsList = payments.filter(
          (p) => p.workerId === record.workerId
        );
        return (
          <Tooltip
            title={
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                  Payment Details:
                </div>
                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                  {workerPaymentsList.map((p, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>
                      ₹{Number(p.amount || 0).toLocaleString()} - {p.date}
                      {p.note && ` (${p.note})`}
                    </li>
                  ))}
                </ul>
                <div
                  style={{
                    marginTop: "8px",
                    fontWeight: "bold",
                    borderTop: "1px solid #ddd",
                    paddingTop: "8px",
                  }}
                >
                  Total: ₹{record.amount.toLocaleString()}
                </div>
              </div>
            }
            overlayStyle={{ maxWidth: "400px" }}
          >
            <Tag color="blue" style={{ cursor: "pointer" }}>
              {count}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Paid Amount",
      dataIndex: "amount",
      render: (v) => <b>₹{v.toLocaleString()}</b>,
    },
    {
      title: "Budget Share",
      dataIndex: "utilizationPercent",
      render: (v) => <Progress percent={v} size="small" />,
    },
  ];

  const recentPaymentColumns = [
    { title: "Date", dataIndex: "date", width: 100 },
    { title: "Worker", dataIndex: "workerName" },
    { title: "Amount", dataIndex: "amount", render: (v) => `₹${v}` },
    { title: "Note", dataIndex: "note", render: (v) => v || "-" },
  ];

  return (
    <div className="p-0 sm:p-2 md:p-4">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 px-2 sm:px-0">
        Dashboard Overview
      </h1>

      {/* KPI CARDS */}
      <div className="px-2 sm:px-0">
        <Row gutter={[8, 8]} className="mb-4">
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="Total Spend"
                value={totalSpend}
                prefix="₹"
                valueStyle={{
                  color: "#cf1322",
                  fontSize: window.innerWidth < 640 ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="Labor Cost"
                value={laborSpend}
                prefix="₹"
                valueStyle={{
                  color: "#1890ff",
                  fontSize: window.innerWidth < 640 ? "18px" : "24px",
                }}
              />
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="Material Cost"
                value={materialSpend}
                prefix="₹"
                valueStyle={{
                  color: "#52c41a",
                  fontSize: window.innerWidth < 640 ? "18px" : "24px",
                }}
              />
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Link to="/documents">
              <Card
                style={{ cursor: "pointer" }}
                className="hover:shadow-lg transition-shadow"
              >
                <Statistic
                  title="Documents"
                  value={documents.length}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Link>
          </Col>
        </Row>
      </div>

      {/* SPENDING BREAKDOWN & QUICK STATS */}
      <div className="px-2 sm:px-0">
        <Row gutter={[8, 8]} className="mb-4">
          <Col xs={24} md={12}>
            <Card title="Cost Distribution" size="small">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Labor</span>
                  <span className="text-sm font-bold">
                    ₹{laborSpend.toLocaleString()} (
                    {totalSpend > 0
                      ? Math.round((laborSpend / totalSpend) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <Progress
                  percent={
                    totalSpend > 0
                      ? Math.round((laborSpend / totalSpend) * 100)
                      : 0
                  }
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Materials</span>
                  <span className="text-sm font-bold">
                    ₹{materialSpend.toLocaleString()} (
                    {totalSpend > 0
                      ? Math.round((materialSpend / totalSpend) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <Progress
                  percent={
                    totalSpend > 0
                      ? Math.round((materialSpend / totalSpend) * 100)
                      : 0
                  }
                  strokeColor="#52c41a"
                  showInfo={false}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Quick Stats" size="small">
              <Row gutter={[8, 8]}>
                <Col xs={12}>
                  <Statistic
                    title="Workers"
                    value={workers.length}
                    valueStyle={{ fontSize: "18px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Tooltip
                    title={
                      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                        <div
                          style={{ fontWeight: "bold", marginBottom: "8px" }}
                        >
                          Payment Breakdown:
                        </div>
                        <ul style={{ paddingLeft: "20px", margin: 0 }}>
                          {payments.map((p, idx) => (
                            <li key={idx} style={{ marginBottom: "4px" }}>
                              ₹{Number(p.amount || 0).toLocaleString()} -{" "}
                              {workers.find((w) => w.id === p.workerId)?.name ||
                                "Unknown"}{" "}
                              ({p.date})
                            </li>
                          ))}
                        </ul>
                        <div
                          style={{
                            marginTop: "8px",
                            fontWeight: "bold",
                            borderTop: "1px solid #ddd",
                            paddingTop: "8px",
                          }}
                        >
                          Total: ₹{laborSpend.toLocaleString()}
                        </div>
                      </div>
                    }
                    overlayStyle={{ maxWidth: "400px" }}
                  >
                    <div style={{ cursor: "pointer" }}>
                      <Statistic
                        title="Payments"
                        value={payments.length}
                        valueStyle={{ fontSize: "18px" }}
                      />
                    </div>
                  </Tooltip>
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Materials"
                    value={materials.length}
                    valueStyle={{ fontSize: "18px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Active Workers"
                    value={activeWorkers}
                    valueStyle={{ fontSize: "18px", color: "#52c41a" }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>

      {/* MATERIAL BREAKDOWN */}
      <h2 className="text-lg sm:text-xl font-semibold mt-6 sm:mt-10 mb-3 sm:mb-4 px-2 sm:px-0">
        Material Cost Breakdown
      </h2>

      <div className="px-2 sm:px-0 mb-4">
        <Card>
          {materialByCategory.length ? (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <Table
                rowKey="category"
                dataSource={materialByCategory}
                columns={materialColumns}
                pagination={false}
                scroll={{ x: "max-content" }}
                size="small"
              />
            </div>
          ) : (
            <Empty description="No material data" />
          )}
        </Card>
      </div>

      {/* WORKER PAYMENTS */}
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-2 sm:px-0">
        Worker Performance & Spending
      </h2>

      <div className="px-2 sm:px-0 mb-4">
        <Card>
          {workerPayments.length ? (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <Table
                rowKey="workerId"
                dataSource={workerPayments}
                columns={workerColumns}
                pagination={false}
                scroll={{ x: "max-content" }}
                size="small"
              />
            </div>
          ) : (
            <Empty description="No worker payments yet" />
          )}
        </Card>
      </div>

      {/* RECENT PAYMENTS */}
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-2 sm:px-0">
        Recent Payments
      </h2>

      <div className="px-2 sm:px-0">
        <Card>
          {recentPayments.length ? (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <Table
                rowKey={(record, idx) => idx}
                dataSource={recentPayments}
                columns={recentPaymentColumns}
                pagination={false}
                scroll={{ x: "max-content" }}
                size="small"
              />
            </div>
          ) : (
            <Empty description="No recent payments" />
          )}
        </Card>
      </div>
    </div>
  );
}

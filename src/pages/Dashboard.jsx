import {
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Card, Col, Empty, Row, Statistic, Table } from "antd";
import { useSelector } from "react-redux";

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

  /* -------- TOP MATERIAL CATEGORIES -------- */

  const materialByCategory = Object.values(
    materials.reduce((acc, m) => {
      const key = m.category || "Other";
      acc[key] = acc[key] || { category: key, amount: 0 };
      acc[key].amount += Number(m.price || 0);
      return acc;
    }, {})
  ).sort((a, b) => b.amount - a.amount);

  /* -------- TOP PAID WORKERS -------- */

  const workerPayments = Object.values(
    payments.reduce((acc, p) => {
      acc[p.workerId] = acc[p.workerId] || {
        workerId: p.workerId,
        amount: 0,
      };
      acc[p.workerId].amount += Number(p.amount || 0);
      return acc;
    }, {})
  )
    .map((w) => ({
      ...w,
      name: workers.find((x) => x.id === w.workerId)?.name || "Unknown",
    }))
    .sort((a, b) => b.amount - a.amount);

  /* ---------------- TABLE COLUMNS ---------------- */

  const materialColumns = [
    { title: "Category", dataIndex: "category" },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (v) => `₹${v.toLocaleString()}`,
    },
  ];

  const workerColumns = [
    { title: "Worker", dataIndex: "name" },
    {
      title: "Paid Amount",
      dataIndex: "amount",
      render: (v) => `₹${v.toLocaleString()}`,
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-6">Dashboard Overview</h1>

      {/* KPI CARDS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Material Spend"
              value={materialSpend}
              prefix={<ShoppingCartOutlined />}
              suffix="₹"
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Labor Spend"
              value={laborSpend}
              prefix={<TeamOutlined />}
              suffix="₹"
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Total Spend"
              value={totalSpend}
              prefix={<WalletOutlined />}
              suffix="₹"
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Documents"
              value={documents.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* MATERIAL BREAKDOWN */}
      <h2 className="text-xl font-semibold mt-10 mb-4">
        Material Cost Breakdown
      </h2>

      <Card>
        {materialByCategory.length ? (
          <Table
            rowKey="category"
            dataSource={materialByCategory}
            columns={materialColumns}
            pagination={false}
          />
        ) : (
          <Empty description="No material data" />
        )}
      </Card>

      {/* WORKER PAYMENTS */}
      <h2 className="text-xl font-semibold mt-10 mb-4">Top Paid Workers</h2>

      <Card>
        {workerPayments.length ? (
          <Table
            rowKey="workerId"
            dataSource={workerPayments}
            columns={workerColumns}
            pagination={false}
          />
        ) : (
          <Empty description="No worker payments yet" />
        )}
      </Card>
    </div>
  );
}

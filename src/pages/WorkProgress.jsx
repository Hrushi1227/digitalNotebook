import { Card, Col, Empty, Progress, Row, Statistic, Table, Tag } from "antd";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import { selectMaterials } from "../store/materialsSlice";
import { selectPayments } from "../store/paymentsSlice";
import { selectWorkers } from "../store/workersSlice";

export default function WorkProgress() {
  const workers = useSelector(selectWorkers);
  const materials = useSelector(selectMaterials);
  const payments = useSelector(selectPayments);

  // ===== Payment Summary =====
  const totalPaid = payments.reduce((a, b) => a + Number(b.amount || 0), 0);
  const avgPayment =
    payments.length > 0 ? Math.round(totalPaid / payments.length) : 0;

  // ===== Material Summary =====
  const totalMaterialCost = materials.reduce(
    (a, m) => a + Number(m.price || 0),
    0
  );
  const totalMaterialItems = materials.length;

  // ===== Overall Budget Spent =====
  const totalSpent = totalPaid + totalMaterialCost;

  // ===== Worker Performance (based on payments) =====
  const workerPerformance = workers
    .map((w) => {
      const workerPayments = payments.filter((p) => p.workerId === w.id);
      const totalPaidToWorker = workerPayments.reduce(
        (a, b) => a + Number(b.amount || 0),
        0
      );
      const paymentCount = workerPayments.length;
      const avgPerPayment =
        paymentCount > 0 ? Math.round(totalPaidToWorker / paymentCount) : 0;

      return {
        id: w.id,
        name: w.name,
        profession: w.profession,
        dailyRate: w.rate,
        totalPaid: totalPaidToWorker,
        paymentCount,
        avgPerPayment,
        utilizationPercent:
          totalPaidToWorker > 0
            ? Math.round((totalPaidToWorker / totalPaid) * 100)
            : 0,
      };
    })
    .sort((a, b) => b.totalPaid - a.totalPaid);

  // ===== Material Usage by Category =====
  const materialsByCategory = {};
  materials.forEach((m) => {
    const cat = m.category || "Other";
    if (!materialsByCategory[cat]) {
      materialsByCategory[cat] = {
        category: cat,
        qty: 0,
        cost: 0,
        items: 0,
      };
    }
    materialsByCategory[cat].qty += Number(m.qty || 0);
    materialsByCategory[cat].cost += Number(m.price || 0);
    materialsByCategory[cat].items += 1;
  });

  const categoryData = Object.values(materialsByCategory).sort(
    (a, b) => b.cost - a.cost
  );

  // ===== Recent Payments (Last 10) =====
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .map((p) => ({
      ...p,
      workerName: workers.find((w) => w.id === p.workerId)?.name || "Unknown",
    }));

  // ===== Columns =====
  const workerColumns = [
    {
      title: "Worker Name",
      dataIndex: "name",
      render: (name, record) => (
        <Link
          to={`/workers/${record.id}`}
          className="text-blue-600 hover:underline"
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
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Total Paid",
      dataIndex: "totalPaid",
      render: (v) => <b>₹{v.toLocaleString()}</b>,
    },
    {
      title: "Budget Share",
      dataIndex: "utilizationPercent",
      render: (v) => <Progress percent={v} size="small" />,
    },
  ];

  const materialColumns = [
    { title: "Category", dataIndex: "category" },
    { title: "Items", dataIndex: "items" },
    { title: "Total Qty", dataIndex: "qty", render: (v) => <b>{v}</b> },
    {
      title: "Total Cost",
      dataIndex: "cost",
      render: (v) => `₹${v.toLocaleString()}`,
    },
    {
      title: "% of Materials",
      render: (_, record) => {
        const percent =
          totalMaterialCost > 0
            ? Math.round((record.cost / totalMaterialCost) * 100)
            : 0;
        return <Progress percent={percent} size="small" />;
      },
    },
  ];

  const recentPaymentColumns = [
    { title: "Date", dataIndex: "date", width: 100 },
    { title: "Worker", dataIndex: "workerName" },
    { title: "Amount", dataIndex: "amount", render: (v) => `₹${v}` },
    { title: "Note", dataIndex: "note", render: (v) => v || "-" },
  ];

  return (
    <div className="p-0 sm:p-2">
      <div className="px-2 sm:px-0">
        <PageHeader title="Renovation Overview & Analytics" />
      </div>

      {/* OVERALL SPENDING SUMMARY */}
      <div className="px-2 sm:px-0">
        <Row gutter={[8, 8]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="text-center">
              <Statistic
                title="Total Spent"
                value={totalSpent}
                prefix="₹"
                valueStyle={{
                  color: "#cf1322",
                  fontSize: window.innerWidth < 640 ? "20px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card className="text-center">
              <Statistic
                title="Labor Cost"
                value={totalPaid}
                prefix="₹"
                valueStyle={{
                  color: "#1890ff",
                  fontSize: window.innerWidth < 640 ? "18px" : "24px",
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card className="text-center">
              <Statistic
                title="Material Cost"
                value={totalMaterialCost}
                prefix="₹"
                valueStyle={{
                  color: "#52c41a",
                  fontSize: window.innerWidth < 640 ? "18px" : "24px",
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* SPENDING BREAKDOWN */}
      <div className="px-2 sm:px-0">
        <Row gutter={[8, 8]} className="mb-4">
          <Col xs={24} md={12}>
            <Card title="Cost Distribution" size="small">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Labor</span>
                  <span className="text-sm font-bold">
                    ₹{totalPaid.toLocaleString()} (
                    {totalSpent > 0
                      ? Math.round((totalPaid / totalSpent) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <Progress
                  percent={
                    totalSpent > 0
                      ? Math.round((totalPaid / totalSpent) * 100)
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
                    ₹{totalMaterialCost.toLocaleString()} (
                    {totalSpent > 0
                      ? Math.round((totalMaterialCost / totalSpent) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <Progress
                  percent={
                    totalSpent > 0
                      ? Math.round((totalMaterialCost / totalSpent) * 100)
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
                  <Statistic
                    title="Payments"
                    value={payments.length}
                    valueStyle={{ fontSize: "18px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Materials"
                    value={totalMaterialItems}
                    valueStyle={{ fontSize: "18px" }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Avg Payment"
                    value={avgPayment}
                    prefix="₹"
                    valueStyle={{ fontSize: "18px" }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>

      {/* WORKER PERFORMANCE */}
      <div className="px-2 sm:px-0 mb-4">
        <Card title="Worker Performance & Spending" size="small">
          {workerPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <Table
                rowKey="id"
                dataSource={workerPerformance}
                columns={workerColumns}
                scroll={{ x: "max-content" }}
                pagination={false}
                size="small"
              />
            </div>
          ) : (
            <Empty description="No worker data available" />
          )}
        </Card>
      </div>

      {/* MATERIAL BREAKDOWN */}
      <div className="px-2 sm:px-0 mb-4">
        <Card title="Material Cost by Category" size="small">
          {categoryData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table
                rowKey="category"
                dataSource={categoryData}
                columns={materialColumns}
                scroll={{ x: "max-content" }}
                pagination={false}
                size="small"
              />
            </div>
          ) : (
            <Empty description="No material data available" />
          )}
        </Card>
      </div>

      {/* RECENT PAYMENTS */}
      <div className="px-2 sm:px-0 mb-4">
        <Card title="Recent Payments" size="small">
          {recentPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table
                rowKey="id"
                dataSource={recentPayments}
                columns={recentPaymentColumns}
                scroll={{ x: "max-content" }}
                pagination={false}
                size="small"
              />
            </div>
          ) : (
            <Empty description="No payment history" />
          )}
        </Card>
      </div>
    </div>
  );
}

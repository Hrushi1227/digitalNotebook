import { Card, Col, Progress, Row, Statistic, Table, Tag } from "antd";
import { useSelector } from "react-redux";
import PageHeader from "../components/common/PageHeader";
import { selectMaterials } from "../store/materialsSlice";
import { selectPayments } from "../store/paymentsSlice";
import { selectTasks } from "../store/tasksSlice";
import { selectWorkers } from "../store/workersSlice";

export default function WorkProgress() {
  const tasks = useSelector(selectTasks);
  const workers = useSelector(selectWorkers);
  const materials = useSelector(selectMaterials);
  const payments = useSelector(selectPayments);

  // ===== Task Progress =====
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const totalTasks = tasks.length;
  const taskCompletionPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ===== Worker Productivity =====
  const workerProductivity = workers.map((w) => {
    const assignedTasks = tasks.filter((t) => t.workerId === w.id);
    const completedByWorker = assignedTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const taskCompletionRate =
      assignedTasks.length > 0
        ? Math.round((completedByWorker / assignedTasks.length) * 100)
        : 0;

    const totalPaid = payments
      .filter((p) => p.workerId === w.id)
      .reduce((a, b) => a + Number(b.amount || 0), 0);

    return {
      id: w.id,
      name: w.name,
      assignedTasks: assignedTasks.length,
      completedTasks: completedByWorker,
      completionRate: taskCompletionRate,
      totalPaid,
      rate: w.rate,
    };
  });

  // ===== Material Usage =====
  const totalMaterials = materials.reduce((a, m) => a + Number(m.qty || 0), 0);
  const materialCost = materials.reduce((a, m) => a + Number(m.price || 0), 0);

  const materialsByCategory = {};
  materials.forEach((m) => {
    if (!materialsByCategory[m.category]) {
      materialsByCategory[m.category] = {
        category: m.category,
        qty: 0,
        cost: 0,
        items: 0,
      };
    }
    materialsByCategory[m.category].qty += Number(m.qty || 0);
    materialsByCategory[m.category].cost += Number(m.price || 0);
    materialsByCategory[m.category].items += 1;
  });

  // ===== Payment Summary =====
  const totalPaid = payments.reduce((a, b) => a + Number(b.amount || 0), 0);

  // ===== Columns =====
  const workerColumns = [
    { title: "Worker Name", dataIndex: "name" },
    {
      title: "Assigned Tasks",
      dataIndex: "assignedTasks",
      render: (v) => <b>{v}</b>,
    },
    {
      title: "Completed",
      dataIndex: "completedTasks",
      render: (v, r) => <Tag color="green">{v}</Tag>,
    },
    {
      title: "Completion %",
      dataIndex: "completionRate",
      render: (v) => (
        <Progress type="circle" percent={v} width={40} format={() => `${v}%`} />
      ),
    },
    {
      title: "Total Paid (₹)",
      dataIndex: "totalPaid",
      render: (v) => <b>₹{v}</b>,
    },
  ];

  const materialColumns = [
    { title: "Category", dataIndex: "category" },
    { title: "Items", dataIndex: "items" },
    { title: "Total Qty", dataIndex: "qty", render: (v) => <b>{v}</b> },
    { title: "Total Cost (₹)", dataIndex: "cost", render: (v) => `₹${v}` },
  ];

  return (
    <div className="p-2">
      <PageHeader title="Work Progress & Analytics" />

      {/* TASK COMPLETION OVERVIEW */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={12}>
          <Card>
            <div className="text-center">
              <Progress
                type="circle"
                percent={taskCompletionPercent}
                width={150}
                format={() => (
                  <div>
                    <div className="text-2xl font-bold">
                      {taskCompletionPercent}%
                    </div>
                    <div className="text-sm text-gray-600">Task Complete</div>
                  </div>
                )}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Row gutter={16}>
              <Col xs={12}>
                <Statistic
                  title="Total Tasks"
                  value={totalTasks}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col xs={12}>
                <Statistic
                  title="Completed"
                  value={completedTasks}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
            </Row>
            <Row gutter={16} className="mt-4">
              <Col xs={12}>
                <Statistic
                  title="Pending"
                  value={totalTasks - completedTasks}
                  valueStyle={{ color: "#faad14" }}
                />
              </Col>
              <Col xs={12}>
                <Statistic title="In Progress" value={0} suffix="(todo)" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* WORKER PRODUCTIVITY */}
      <Card className="mb-6" title="Worker Productivity & Performance">
        <div style={{ overflowX: "auto" }}>
          <Table
            rowKey="id"
            dataSource={workerProductivity}
            columns={workerColumns}
            scroll={{ x: "max-content" }}
            pagination={false}
          />
        </div>
      </Card>

      {/* MATERIAL USAGE */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={12}>
          <Card title="Material Summary">
            <Statistic
              title="Total Items"
              value={totalMaterials}
              valueStyle={{ color: "#1890ff" }}
            />
            <Statistic
              title="Total Cost"
              value={materialCost}
              prefix="₹"
              valueStyle={{ color: "#ff7a45" }}
              className="mt-4"
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Cost per Category">
            <div style={{ overflowX: "auto" }}>
              <Table
                rowKey="category"
                dataSource={Object.values(materialsByCategory)}
                columns={materialColumns}
                scroll={{ x: "max-content" }}
                pagination={false}
                size="small"
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* PAYMENT SUMMARY */}
      <Card title="Payment Summary">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic
              title="Total Payments Made"
              value={totalPaid}
              prefix="₹"
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="Number of Payments" value={payments.length} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="Avg Payment"
              value={
                payments.length > 0
                  ? Math.round(totalPaid / payments.length)
                  : 0
              }
              prefix="₹"
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}

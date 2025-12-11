import { Card, Col, Row, Table } from "antd";
import { useSelector } from "react-redux";
import { selectMaterials } from "../store/materialsSlice";
import { selectPayments } from "../store/paymentsSlice";
import { selectTasks } from "../store/tasksSlice";
import { selectWorkerTotals, selectWorkers } from "../store/workersSlice";

export default function Dashboard() {
  const workers = useSelector(selectWorkers);
  const materials = useSelector(selectMaterials);
  const payments = useSelector(selectPayments);
  const tasks = useSelector(selectTasks);
  const totals = useSelector(selectWorkerTotals);

  const matSpend = materials.reduce((a, m) => a + Number(m.price || 0), 0);
  const taskSpend = tasks.reduce((a, t) => a + Number(t.cost || 0), 0);
  const paid = payments.reduce((a, p) => a + Number(p.amount || 0), 0);

  const summary = [
    { title: "Total Worker Budget", value: totals.budget },
    { title: "Total Paid (All)", value: paid },
    { title: "Pending to Workers", value: totals.pending },
    { title: "Materials Spend", value: matSpend },
    { title: "Task Cost (sum)", value: taskSpend },
    { title: "Workers", value: workers.length },
    { title: "Tasks", value: tasks.length },
    { title: "Materials", value: materials.length },
  ];

  const recentPayments = [...payments].slice(-5).reverse();

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        {summary.map((s, i) => (
          <Col xs={24} sm={12} md={8} lg={6} key={i}>
            <Card className="shadow" title={s.title}>
              ₹ {s.value}
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow" title="Recent Payments">
        <Table
          rowKey={(r, idx) => idx}
          size="small"
          pagination={false}
          dataSource={recentPayments}
          columns={[
            { title: "Date", dataIndex: "date" },
            { title: "Worker", dataIndex: "workerId" },
            { title: "Amount", dataIndex: "amount" },
            { title: "Method", dataIndex: "method" },
          ]}
        />
      </Card>
    </div>
  );
}

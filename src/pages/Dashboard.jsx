import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import { useSelector } from "react-redux";

import { useEffect } from "react";
import { addItem, updateItem } from "../firebaseService";
import { selectBudgets } from "../store/budgetsSlice";
import { selectInvoices } from "../store/invoicesSlice";
import { selectLedger } from "../store/ledgerSlice";
import { selectMaterials } from "../store/materialsSlice";
import { selectPayments } from "../store/paymentsSlice";
import { selectSchedules } from "../store/schedulesSlice";
import { selectWorkers } from "../store/workersSlice";

export default function Dashboard() {
  const materials = useSelector(selectMaterials);
  const payments = useSelector(selectPayments);
  const budgets = useSelector(selectBudgets);
  const schedules = useSelector(selectSchedules);
  const invoices = useSelector(selectInvoices);
  const ledger = useSelector(selectLedger);
  const workers = useSelector(selectWorkers);

  // ------------------- CALCULATIONS -------------------

  // Total material cost
  const materialSpend = materials.reduce((a, b) => a + Number(b.price || 0), 0);

  // Total payments to workers
  const paymentSpend = payments.reduce((a, b) => a + Number(b.amount || 0), 0);

  // Invoices total
  const invoiceSpend = invoices.reduce((a, b) => a + Number(b.amount || 0), 0);

  // Total ledger debit/credit
  const totalDebit = ledger
    .filter((l) => l.type === "debit")
    .reduce((a, b) => a + Number(b.amount), 0);

  const totalCredit = ledger
    .filter((l) => l.type === "credit")
    .reduce((a, b) => a + Number(b.amount), 0);

  // Net balance
  const netBalance = totalCredit - totalDebit;

  // Upcoming schedules (next 7 days)
  const upcoming = schedules
    .filter((s) => s.status === "pending")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // ------------------- TABLE COLUMNS -------------------
  const scheduleColumns = [
    {
      title: "Worker",
      dataIndex: "workerId",
      render: (id) => workers.find((w) => w.id === id)?.name || "-",
    },
    { title: "Phase", dataIndex: "phase" },
    { title: "Amount", dataIndex: "amount" },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (d) => <b>{d}</b>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) =>
        s === "pending" ? (
          <Tag color="orange">Pending</Tag>
        ) : (
          <Tag color="green">Paid</Tag>
        ),
    },
  ];

  useEffect(() => {
    addItem("testConnect", { test: true });
  }, []);

  const handleBudgetUpdate = (record, val) => {
    updateItem("budgets", record.id, { ...record, allocated: val });
  };

  return (
    <div className="p-2">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      {/* TOP STATS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Material Spend"
              value={materialSpend}
              prefix="₹"
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Worker Payments"
              value={paymentSpend}
              prefix="₹"
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Invoices Total" value={invoiceSpend} prefix="₹" />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Net Balance"
              value={netBalance}
              prefix="₹"
              valueStyle={{ color: netBalance < 0 ? "red" : "green" }}
            />
          </Card>
        </Col>
      </Row>

      {/* BUDGET SUMMARY */}
      <h2 className="text-xl font-semibold mt-10 mb-4">Budget Summary</h2>
      <Row gutter={[16, 16]}>
        {budgets.map((b) => {
          // Calculate spend for that category
          const categorySpend = materials
            .filter((m) => m.category === b.key)
            .reduce((a, v) => a + Number(v.price || 0), 0);

          const overBudget = categorySpend > Number(b.allocated);

          return (
            <Col xs={24} md={6} key={b.id}>
              <Card>
                <Statistic
                  title={b.key}
                  value={categorySpend}
                  prefix="₹"
                  suffix={`/ ${b.allocated}`}
                  valueStyle={{ color: overBudget ? "red" : "green" }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* UPCOMING SCHEDULES */}
      <h2 className="text-xl font-semibold mt-10 mb-4">Upcoming Payments</h2>

      <Card>
        <Table
          rowKey="id"
          dataSource={upcoming}
          columns={scheduleColumns}
          pagination={false}
        />
      </Card>
    </div>
  );
}

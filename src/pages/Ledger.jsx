import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Statistic,
  Table,
  Tag,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";

import dayjs from "dayjs";

import { addItem, deleteItem } from "../firebaseService";
import { selectLedger } from "../store/ledgerSlice";

export default function Ledger() {
  const ledger = useSelector(selectLedger);
  const [open, setOpen] = useState(false);

  // ---- Calculations ----
  const totalDebit = ledger
    .filter((l) => l.type === "debit")
    .reduce((a, b) => a + Number(b.amount), 0);

  const totalCredit = ledger
    .filter((l) => l.type === "credit")
    .reduce((a, b) => a + Number(b.amount), 0);

  const net = totalCredit - totalDebit;

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      render: (t) =>
        t === "debit" ? (
          <Tag color="red">Debit</Tag>
        ) : (
          <Tag color="green">Credit</Tag>
        ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (v) => `₹${v}`,
    },
    { title: "Date", dataIndex: "date" },
    { title: "Note", dataIndex: "note" },

    {
      title: "Action",
      render: (_, r) => (
        <Popconfirm
          title="Delete entry?"
          onConfirm={() => deleteItem("ledger", r.id)}
        >
          <Button danger size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-2">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Ledger</h1>
        <Button type="primary" onClick={() => setOpen(true)}>
          Add Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Debit"
              value={totalDebit}
              prefix="₹"
              valueStyle={{ color: "red" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Credit"
              value={totalCredit}
              prefix="₹"
              valueStyle={{ color: "green" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Net Balance"
              value={net}
              prefix="₹"
              valueStyle={{ color: net < 0 ? "red" : "green" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Ledger table */}
      <Card className="mt-6">
        <Table rowKey="id" dataSource={ledger} columns={columns} />
      </Card>

      {/* Add Entry Modal */}
      <Modal
        open={open}
        title="Add Ledger Entry"
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("ledgerSubmit").click()}
      >
        <Form
          layout="vertical"
          onFinish={async (vals) => {
            await addItem("ledger", {
              type: vals.type,
              amount: vals.amount,
              note: vals.note || "",
              date: vals.date.format("YYYY-MM-DD"),
            });

            setOpen(false);
          }}
        >
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <select className="w-full border p-2 rounded">
              <option value="">Select type</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </Form.Item>

          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item name="note" label="Note">
            <Input />
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" defaultValue={dayjs()} />
          </Form.Item>

          <button id="ledgerSubmit" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

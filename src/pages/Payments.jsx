import {
  Button,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Table,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";

import dayjs from "dayjs";

import { selectPayments } from "../store/paymentsSlice";
import { selectWorkers } from "../store/workersSlice";

import { addItem, deleteItem } from "../firebaseService";

export default function Payments() {
  const payments = useSelector(selectPayments);
  const workers = useSelector(selectWorkers);

  const [open, setOpen] = useState(false);

  const columns = [
    {
      title: "Worker",
      dataIndex: "workerId",
      render: (id) => workers.find((w) => w.id === id)?.name || "-",
    },
    { title: "Amount", dataIndex: "amount", render: (v) => `₹${v}` },
    { title: "Date", dataIndex: "date" },
    { title: "Note", dataIndex: "note" },
    {
      title: "Action",
      render: (_, r) => (
        <Popconfirm
          title="Delete payment?"
          onConfirm={() => deleteItem("payments", r.id)}
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
        <h1 className="text-xl font-semibold">Payments</h1>

        <Button type="primary" onClick={() => setOpen(true)}>
          Add Payment
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={payments}
        columns={columns}
        className="bg-white p-2 rounded-lg shadow"
      />

      <Modal
        open={open}
        title="Add Payment"
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("paySubmitBtn").click()}
      >
        <Form
          layout="vertical"
          onFinish={async (vals) => {
            await addItem("payments", {
              workerId: vals.workerId,
              amount: vals.amount,
              note: vals.note || "",
              date: vals.date.format("YYYY-MM-DD"),
            });

            setOpen(false);
          }}
        >
          <Form.Item
            name="workerId"
            label="Worker"
            rules={[{ required: true }]}
          >
            <Select
              options={workers.map((w) => ({
                label: w.name,
                value: w.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item name="note" label="Note">
            <input
              className="border rounded p-2 w-full"
              placeholder="Optional note"
            />
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" defaultValue={dayjs()} />
          </Form.Item>

          <button id="paySubmitBtn" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

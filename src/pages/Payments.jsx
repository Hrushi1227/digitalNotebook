import {
  Button,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
  Table,
} from "antd";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import dayjs from "dayjs";

import {
  addPayment,
  deletePayment,
  selectPayments,
} from "../store/paymentsSlice";
import { selectWorkers } from "../store/workersSlice";

import ProtectedAction from "../components/common/ProtectedAction";
import { addItem, deleteItem } from "../firebaseService";

export default function Payments() {
  const payments = useSelector(selectPayments);
  const paymentsUnique = useMemo(() => {
    // keep last occurrence for each id
    return Array.from(new Map(payments.map((p) => [p.id, p])).values());
  }, [payments]);
  const workers = useSelector(selectWorkers);
  const dispatch = useDispatch();

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
        <ProtectedAction
          title="Passcode required to delete"
          onAuthorized={() => {
            Modal.confirm({
              title: "Delete payment?",
              onOk: async () => {
                await deleteItem("payments", r.id);
                dispatch(deletePayment(r.id));
              },
            });
          }}
        >
          <Button danger size="small">
            Delete
          </Button>
        </ProtectedAction>
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

      <div style={{ overflowX: "auto" }}>
        <Table
          rowKey="id"
          dataSource={paymentsUnique}
          columns={columns}
          className="bg-white p-2 rounded-lg shadow"
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        open={open}
        title="Add Payment"
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("paySubmitBtn").click()}
      >
        <Form
          layout="vertical"
          onFinish={async (vals) => {
            const payload = {
              workerId: vals.workerId,
              amount: vals.amount,
              note: vals.note || "",
              date: vals.date.format("YYYY-MM-DD"),
            };
            const res = await addItem("payments", payload);
            dispatch(addPayment({ id: res.id, ...payload }));

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

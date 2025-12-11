import {
  Button,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../components/common/PageHeader";
import {
  addPayment,
  deletePayment,
  selectPayments,
} from "../store/paymentsSlice";
import { applyPaymentToWorker, selectWorkers } from "../store/workersSlice";

export default function Payments() {
  const payments = useSelector(selectPayments);
  const workers = useSelector(selectWorkers);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const columns = [
    {
      title: "Worker",
      dataIndex: "workerId",
      render: (id) => workers.find((w) => w.id === id)?.name || "-",
    },
    { title: "Amount", dataIndex: "amount" },
    { title: "Date", dataIndex: "date" },
    { title: "Method", dataIndex: "method" },
    { title: "Phase", dataIndex: "phase" },
    {
      title: "Action",
      render: (_, r) => (
        <Space>
          <Popconfirm
            title="Delete payment?"
            onConfirm={() => dispatch(deletePayment(r.id))}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const total = payments.reduce((a, p) => a + Number(p.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        extra={
          <div className="flex items-center gap-3">
            <div className="text-gray-600">
              Total Paid: <b>₹ {total}</b>
            </div>
            <Button type="primary" onClick={() => setOpen(true)}>
              Add Payment
            </Button>
          </div>
        }
      />
      <div className="bg-white rounded-xl p-4 shadow">
        <Table rowKey="id" columns={columns} dataSource={payments} />
      </div>

      <Modal
        open={open}
        title="Add Payment"
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("paySubmitAll").click()}
      >
        <Form
          layout="vertical"
          onFinish={(vals) => {
            const payload = { ...vals, date: vals.date.format("YYYY-MM-DD") };
            dispatch(addPayment(payload));
            dispatch(
              applyPaymentToWorker({
                workerId: vals.workerId,
                amount: vals.amount,
              })
            );
            setOpen(false);
          }}
        >
          <Form.Item
            name="workerId"
            label="Worker"
            rules={[{ required: true }]}
          >
            <Select
              options={workers.map((w) => ({ value: w.id, label: w.name }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" defaultValue={dayjs()} />
          </Form.Item>
          <Form.Item name="method" label="Method" rules={[{ required: true }]}>
            <Select
              options={[{ value: "UPI" }, { value: "Cash" }, { value: "Bank" }]}
            />
          </Form.Item>
          <Form.Item name="phase" label="Phase">
            <Select
              options={[
                { value: "Advance" },
                { value: "Mid" },
                { value: "Final" },
              ]}
            />
          </Form.Item>
          <button id="paySubmitAll" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

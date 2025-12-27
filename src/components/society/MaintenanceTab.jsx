import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Table,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectUserRole } from "../../store/authSlice";

export default function MaintenanceTab() {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  // TODO: Replace with real Redux/Firestore data
  const [bills, setBills] = useState([]);
  const userRole = useSelector(selectUserRole);

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    setTimeout(() => form.resetFields(), 200);
  };

  const handleAdd = (vals) => {
    setBills([
      ...bills,
      {
        id: Date.now(),
        flat: vals.flat,
        amount: vals.amount,
        dueDate: vals.dueDate.format("YYYY-MM-DD"),
        paid: false,
      },
    ]);
    message.success("Bill added");
    setTimeout(() => form.resetFields(), 200);
    hideModal();
  };

  const markPaid = (id) => {
    setBills(bills.map((b) => (b.id === id ? { ...b, paid: true } : b)));
    message.success("Marked as paid");
  };

  const columns = [
    { title: "Flat", dataIndex: "flat" },
    { title: "Amount", dataIndex: "amount", render: (v) => `₹${v}` },
    { title: "Due Date", dataIndex: "dueDate" },
    { title: "Status", dataIndex: "paid", render: (v) => (v ? "Paid" : "Due") },
    {
      title: "Action",
      render: (_, rec) =>
        !rec.paid && userRole?.includes("admin") ? (
          <Button type="link" onClick={() => markPaid(rec.id)}>
            Mark Paid
          </Button>
        ) : null,
    },
  ];

  return (
    <Card
      title="Maintenance & Finance"
      extra={
        userRole?.includes("admin") && (
          <Button type="primary" onClick={showModal}>
            Add Bill
          </Button>
        )
      }
    >
      <Table
        dataSource={bills}
        columns={columns}
        rowKey="id"
        pagination={false}
      />
      <Modal
        open={visible}
        onCancel={hideModal}
        onOk={() => form.submit()}
        title="Add Maintenance Bill"
        okText="Add"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="flat" label="Flat No." rules={[{ required: true }]}>
            {" "}
            <Input />{" "}
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            {" "}
            <InputNumber min={0} style={{ width: "100%" }} />{" "}
          </Form.Item>
          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true }]}
          >
            {" "}
            <DatePicker style={{ width: "100%" }} />{" "}
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

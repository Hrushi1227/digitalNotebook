import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectUserRole } from "../../store/authSlice";

// TODO: Replace with real Redux/Firestore data
const statusColors = {
  Open: "red",
  "In Progress": "orange",
  Resolved: "green",
};

export default function ComplaintsTab() {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [complaints, setComplaints] = useState([]);
  const userRole = useSelector(selectUserRole);

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    setTimeout(() => form.resetFields(), 200);
  };

  const handleAdd = (vals) => {
    setComplaints([
      ...complaints,
      {
        id: Date.now(),
        flat: vals.flat,
        type: vals.type,
        desc: vals.desc,
        status: "Open",
      },
    ]);
    message.success("Complaint submitted");
    setTimeout(() => form.resetFields(), 200);
    hideModal();
  };

  const updateStatus = (id, status) => {
    setComplaints(complaints.map((c) => (c.id === id ? { ...c, status } : c)));
    message.success("Status updated");
  };

  const columns = [
    { title: "Flat", dataIndex: "flat" },
    { title: "Type", dataIndex: "type" },
    { title: "Description", dataIndex: "desc" },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => <Tag color={statusColors[v] || "blue"}>{v}</Tag>,
    },
    {
      title: "Action",
      render: (_, rec) =>
        userRole?.includes("admin") && rec.status !== "Resolved" ? (
          <Select
            value={rec.status}
            style={{ width: 120 }}
            onChange={(val) => updateStatus(rec.id, val)}
            options={[
              { value: "Open", label: "Open" },
              { value: "In Progress", label: "In Progress" },
              { value: "Resolved", label: "Resolved" },
            ]}
          />
        ) : null,
    },
  ];

  return (
    <Card
      title="Complaints & Requests"
      extra={
        userRole && (
          <Button type="primary" onClick={showModal}>
            Raise Complaint
          </Button>
        )
      }
    >
      <Table
        dataSource={complaints}
        columns={columns}
        rowKey="id"
        pagination={false}
      />
      <Modal
        open={visible}
        onCancel={hideModal}
        onOk={() => form.submit()}
        title="Raise Complaint"
        okText="Submit"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="flat" label="Flat No." rules={[{ required: true }]}>
            {" "}
            <Input />{" "}
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            {" "}
            <Select
              options={[
                { value: "Plumbing", label: "Plumbing" },
                { value: "Security", label: "Security" },
                { value: "Cleaning", label: "Cleaning" },
                { value: "Other", label: "Other" },
              ]}
            />{" "}
          </Form.Item>
          <Form.Item
            name="desc"
            label="Description"
            rules={[{ required: true }]}
          >
            {" "}
            <Input.TextArea rows={3} />{" "}
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

import { Button, Card, Form, Input, Modal, Select, Table, message } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectUserRole } from "../../store/authSlice";

const dummyVendors = [
  { id: 1, name: "Ramesh", type: "Security", phone: "9876543210" },
  { id: 2, name: "Suresh", type: "Cleaner", phone: "9876501234" },
];

export default function VendorsTab() {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [vendors, setVendors] = useState(dummyVendors);
  const userRole = useSelector(selectUserRole);

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    setTimeout(() => form.resetFields(), 200);
  };

  const handleAdd = (vals) => {
    setVendors([
      ...vendors,
      {
        id: Date.now(),
        name: vals.name,
        type: vals.type,
        phone: vals.phone,
      },
    ]);
    message.success("Vendor/staff added");
    setTimeout(() => form.resetFields(), 200);
    hideModal();
  };

  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Type", dataIndex: "type" },
    { title: "Phone", dataIndex: "phone" },
  ];

  return (
    <Card
      title="Vendors & Staff"
      extra={
        userRole?.includes("admin") && (
          <Button type="primary" onClick={showModal}>
            Add Staff/Vendor
          </Button>
        )
      }
    >
      <Table
        dataSource={vendors}
        columns={columns}
        rowKey="id"
        pagination={false}
      />
      <Modal
        open={visible}
        onCancel={hideModal}
        onOk={() => form.submit()}
        title="Add Staff/Vendor"
        okText="Add"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            {" "}
            <Input />{" "}
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            {" "}
            <Select
              options={[
                { value: "Security", label: "Security" },
                { value: "Cleaner", label: "Cleaner" },
                { value: "Gardener", label: "Gardener" },
                { value: "Plumber", label: "Plumber" },
                { value: "Electrician", label: "Electrician" },
                { value: "Other", label: "Other" },
              ]}
            />{" "}
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            {" "}
            <Input />{" "}
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

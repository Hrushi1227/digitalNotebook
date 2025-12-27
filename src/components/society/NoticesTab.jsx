import { Button, Card, Form, Input, List, message, Modal } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectUserRole } from "../../store/authSlice";

// TODO: Replace with real Redux/Firestore data

export default function NoticesTab() {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [notices, setNotices] = useState([]);
  const userRole = useSelector(selectUserRole);

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    setTimeout(() => form.resetFields(), 200); // Ensure modal closes before reset
  };

  const handleAdd = (vals) => {
    setNotices([
      { id: Date.now(), title: vals.title, content: vals.content },
      ...notices,
    ]);
    message.success("Notice published");
    setTimeout(() => form.resetFields(), 200);
    hideModal();
  };

  return (
    <Card
      title="Notices & Announcements"
      extra={
        userRole?.includes("admin") && (
          <Button type="primary" onClick={showModal}>
            Publish Notice
          </Button>
        )
      }
    >
      <List
        dataSource={notices}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={<b>{item.title}</b>}
              description={item.content}
            />
          </List.Item>
        )}
      />
      <Modal
        open={visible}
        onCancel={hideModal}
        onOk={() => form.submit()}
        title="Publish Notice"
        okText="Publish"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter Title" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: "Please enter Content" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

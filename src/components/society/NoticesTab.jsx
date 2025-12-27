import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUserRole } from "../../store/authSlice";
import {
  addNotice,
  listenNotices,
  selectNotices,
} from "../../store/noticesSlice";

export default function NoticesTab() {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const notices = useSelector(selectNotices);
  const userRole = useSelector(selectUserRole);

  useEffect(() => {
    const unsub = dispatch(listenNotices());
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [dispatch]);

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    setTimeout(() => form.resetFields(), 200);
  };

  const handleAdd = (vals) => {
    dispatch(
      addNotice({
        title: vals.title,
        content: vals.content,
        createdAt: Date.now(),
      })
    )
      .unwrap()
      .then(() => {
        message.success("Notice published");
        setTimeout(() => form.resetFields(), 200);
        hideModal();
      })
      .catch(() => {
        message.error("Failed to publish notice");
      });
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

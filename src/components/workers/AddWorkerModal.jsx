import { Form, Input, InputNumber, Modal, Select } from "antd";

export default function AddWorkerModal({
  open,
  onCancel,
  onSubmit,
  initialValues,
}) {
  const [form] = Form.useForm();

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      title={initialValues ? "Edit Worker" : "Add Worker"}
      okText={initialValues ? "Save" : "Add"}
      destroyOnClose
      afterOpenChange={(o) => {
        if (o && initialValues) form.setFieldsValue(initialValues);
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={initialValues}
      >
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input placeholder="e.g., Raju (Electrician)" />
        </Form.Item>
        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
          <Select
            options={[
              { value: "Electrician", label: "Electrician" },
              { value: "POP", label: "POP" },
              { value: "Carpenter", label: "Carpenter" },
              { value: "Painter", label: "Painter" },
              { value: "Plumber", label: "Plumber" },
              { value: "Other", label: "Other" },
            ]}
          />
        </Form.Item>
        <Form.Item name="phone" label="Phone">
          <Input placeholder="Phone" />
        </Form.Item>
        <Form.Item
          name="totalAmount"
          label="Agreed Amount"
          rules={[{ required: true }]}
        >
          <InputNumber className="w-full" min={0} />
        </Form.Item>
        <Form.Item name="paidAmount" label="Already Paid" initialValue={0}>
          <InputNumber className="w-full" min={0} />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

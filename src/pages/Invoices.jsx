import { UploadOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Table,
  Upload,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";

import dayjs from "dayjs";

import { addItem, deleteItem } from "../firebaseService";
import { selectInvoices } from "../store/invoicesSlice";

export default function Invoices() {
  const invoices = useSelector(selectInvoices);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);

  // Convert image to Base64
  const toBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const columns = [
    { title: "Vendor", dataIndex: "vendor" },
    { title: "Amount", dataIndex: "amount" },
    { title: "Date", dataIndex: "date" },
    {
      title: "Action",
      render: (_, r) => (
        <Popconfirm
          title="Delete invoice?"
          onConfirm={() => deleteItem("invoices", r.id)}
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
        <h1 className="text-xl font-semibold">Invoices</h1>
        <Button type="primary" onClick={() => setOpen(true)}>
          Upload Invoice
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={invoices}
        columns={columns}
        className="bg-white p-2 rounded-lg shadow"
      />

      <Modal
        open={open}
        title="Add Invoice"
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("invoiceSubmitBtn").click()}
      >
        <Form
          layout="vertical"
          onFinish={async (vals) => {
            const img = file ? await toBase64(file) : "";

            await addItem("invoices", {
              vendor: vals.vendor,
              amount: vals.amount,
              date: vals.date.format("YYYY-MM-DD"),
              image: img, // stored as Base64
            });

            setOpen(false);
            setFile(null);
          }}
        >
          <Form.Item name="vendor" label="Vendor" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" defaultValue={dayjs()} />
          </Form.Item>

          <Upload
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>

          <button
            id="invoiceSubmitBtn"
            type="submit"
            className="hidden"
          ></button>
        </Form>
      </Modal>
    </div>
  );
}

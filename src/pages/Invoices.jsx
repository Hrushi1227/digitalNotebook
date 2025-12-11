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
import dayjs from "dayjs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addInvoice,
  deleteInvoice,
  selectInvoices,
} from "../store/invoicesSlice";

function toBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

export default function Invoices() {
  const invoices = useSelector(selectInvoices);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);

  const columns = [
    { title: "Vendor", dataIndex: "vendor" },
    { title: "Amount", dataIndex: "amount" },
    { title: "Date", dataIndex: "date" },
    {
      title: "Action",
      render: (_, r) => (
        <Popconfirm
          title="Delete?"
          onConfirm={() => dispatch(deleteInvoice(r.id))}
        >
          <Button danger>Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <Button type="primary" onClick={() => setOpen(true)}>
          Upload Invoice
        </Button>
      </div>

      <Table rowKey="id" dataSource={invoices} columns={columns} />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("invoice-submit").click()}
        title="Upload Invoice"
      >
        <Form
          layout="vertical"
          onFinish={async (vals) => {
            let img = file ? await toBase64(file) : "";
            dispatch(
              addInvoice({
                ...vals,
                date: vals.date.format("YYYY-MM-DD"),
                image: img,
              })
            );
            setOpen(false);
          }}
        >
          <Form.Item name="vendor" label="Vendor" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber className="w-full" />
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" defaultValue={dayjs()} />
          </Form.Item>

          <Upload beforeUpload={(f) => (setFile(f), false)}>
            <Button icon={<UploadOutlined />}>Choose Invoice Image</Button>
          </Upload>

          <button id="invoice-submit" type="submit" className="hidden"></button>
        </Form>
      </Modal>
    </>
  );
}

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// AntD imports
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
} from "antd";

// Day.js
import dayjs from "dayjs";

// Redux slice actions & selectors
import {
  addMaterial,
  deleteMaterial,
  selectMaterials,
  updateMaterial,
} from "../store/materialsSlice";

// Common components
import PageHeader from "../components/common/PageHeader";

export default function Materials() {
  const materials = useSelector(selectMaterials);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Qty", dataIndex: "qty" },
    { title: "Price", dataIndex: "price" },
    { title: "Vendor", dataIndex: "vendor" },
    { title: "Category", dataIndex: "category" },
    { title: "Date", dataIndex: "date" },
    {
      title: "Action",
      render: (_, r) => (
        <Space>
          <Button
            onClick={() => {
              setEdit(r);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete material?"
            onConfirm={() => dispatch(deleteMaterial(r.id))}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const total = materials.reduce((a, m) => a + Number(m.price || 0), 0);

  return (
    <div>
      <PageHeader
        title="Materials"
        extra={
          <div className="text-gray-600">
            Total Spend: <b>₹ {total}</b>
          </div>
        }
      />

      <div className="bg-white rounded-xl p-4 shadow mb-4">
        <Button
          type="primary"
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
        >
          Add Material
        </Button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <Table rowKey="id" dataSource={materials} columns={columns} />
      </div>

      <Modal
        open={open}
        title={edit ? "Edit Material" : "Add Material"}
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("matSubmit").click()}
      >
        <Form
          layout="vertical"
          initialValues={edit || { date: dayjs().format("YYYY-MM-DD") }}
          onFinish={(vals) => {
            const payload = {
              ...edit,
              ...vals,
              date: vals.date?.format
                ? vals.date.format("YYYY-MM-DD")
                : vals.date,
            };

            if (edit) dispatch(updateMaterial(payload));
            else dispatch(addMaterial(payload));
            setOpen(false);
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="qty" label="Quantity" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item name="vendor" label="Vendor">
            <Input />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Select
              options={[
                { value: "Cement" },
                { value: "POP" },
                { value: "Electrical" },
                { value: "Paint" },
                { value: "Wood" },
                { value: "Other" },
              ]}
            />
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" defaultValue={dayjs()} />
          </Form.Item>

          <button id="matSubmit" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

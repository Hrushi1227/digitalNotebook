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
import dayjs from "dayjs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import PageHeader from "../components/common/PageHeader";
import { addItem, deleteItem, updateItem } from "../firebaseService";

import {
  addMaterial,
  deleteMaterial,
  selectMaterials,
  updateMaterial,
} from "../store/materialsSlice";

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
            onConfirm={async () => {
              await deleteItem("materials", r.id);
              dispatch(deleteMaterial(r.id));
            }}
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
            Total Spend: <b>₹{total}</b>
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
          initialValues={edit || { date: dayjs() }}
          onFinish={async (vals) => {
            const payload = {
              ...vals,
              date: vals.date.format("YYYY-MM-DD"),
            };

            if (edit) {
              await updateItem("materials", edit.id, payload);
              dispatch(updateMaterial({ id: edit.id, ...payload }));
            } else {
              const res = await addItem("materials", payload);
              dispatch(addMaterial({ id: res.id, ...payload }));
            }

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
            <DatePicker className="w-full" />
          </Form.Item>

          <button id="matSubmit" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

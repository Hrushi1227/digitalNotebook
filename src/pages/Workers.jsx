import { Button, Form, Input, InputNumber, Modal, Table } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Link } from "react-router-dom";

import AdminOnly from "../components/common/AdminOnly";
import { addItem, deleteItem, updateItem } from "../firebaseService";
import { selectIsAdmin } from "../store/authSlice";
import {
  addWorker,
  deleteWorker,
  selectWorkers,
  updateWorker,
} from "../store/workersSlice";

export default function Workers() {
  const workers = useSelector(selectWorkers);
  const dispatch = useDispatch();
  const isAdmin = useSelector(selectIsAdmin);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text, r) => (
        <Link className="text-blue-600" to={`/workers/${r.id}`}>
          {text}
        </Link>
      ),
    },
    { title: "Phone", dataIndex: "phone" },
    { title: "Profession", dataIndex: "profession" },
    { title: "Rate (₹/day)", dataIndex: "rate" },

    ...(isAdmin
      ? [
          {
            title: "Actions",
            render: (_, r) => (
              <AdminOnly
                onEdit={() => {
                  setEdit(r);
                  setOpen(true);
                }}
                onDelete={async () => {
                  await deleteItem("workers", r.id);
                  dispatch(deleteWorker(r.id));
                }}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Workers</h1>

        {isAdmin && (
          <Button
            type="primary"
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
          >
            Add Worker
          </Button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <Table
          rowKey="id"
          dataSource={workers}
          columns={columns}
          className="bg-white p-2 rounded-lg shadow"
          scroll={{ x: "max-content" }}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={open}
        title={edit ? "Edit Worker" : "Add Worker"}
        onCancel={() => {
          setOpen(false);
          setEdit(null);
        }}
        onOk={() => document.getElementById("workerSubmitBtn").click()}
      >
        <Form
          layout="vertical"
          initialValues={
            edit
              ? {
                  name: edit.name,
                  phone: edit.phone,
                  profession: edit.profession,
                  rate: edit.rate,
                }
              : {}
          }
          onFinish={async (vals) => {
            if (edit) {
              await updateItem("workers", edit.id, vals);
              dispatch(updateWorker({ id: edit.id, ...vals }));
            } else {
              const res = await addItem("workers", {
                name: vals.name,
                phone: vals.phone,
                profession: vals.profession,
                rate: vals.rate || 0,
              });
              dispatch(
                addWorker({ id: res.id, ...vals, rate: vals.rate || 0 })
              );
            }
            setOpen(false);
            setEdit(null);
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Worker Name" />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input placeholder="Phone Number" />
          </Form.Item>

          <Form.Item name="profession" label="Profession">
            <Input placeholder="Electrician, POP, Carpenter etc." />
          </Form.Item>

          <Form.Item name="rate" label="Daily Rate (₹)">
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <button id="workerSubmitBtn" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

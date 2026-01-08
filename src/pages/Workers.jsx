import { Button, Form, Input, InputNumber, Modal, Table } from "antd";
import { useEffect, useState } from "react";
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
  const [form] = Form.useForm();

  // Pre-fill form when editing, reset when adding
  useEffect(() => {
    if (open) {
      if (edit) {
        // Strip +91 prefix if present for editing
        const phoneValue = edit.phone?.replace(/^\+91\s*/, "") || edit.phone;
        form.setFieldsValue({
          ...edit,
          phone: phoneValue,
        });
      } else {
        form.resetFields();
      }
    }
    // form is stable from Form.useForm(), safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, edit]);

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
    {
      title: "Phone",
      dataIndex: "phone",
      render: (phone) => (phone ? `+91${phone}` : "-"),
    },
    { title: "Profession", dataIndex: "profession" },
    { title: "Rates", dataIndex: "rate" },

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
                  try {
                    await deleteItem("workers", r.id);
                    dispatch(deleteWorker(r.id));
                  } catch (error) {
                    console.error("Failed to delete worker:", error);
                  }
                }}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-0 sm:p-2">
      {/* Header */}
      <div className="flex justify-between mb-3 sm:mb-4 px-2 sm:px-0">
        <h1 className="text-lg sm:text-xl font-semibold">Workers</h1>

        {isAdmin && (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
          >
            <span className="hidden sm:inline">Add Worker</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-2 sm:px-0">
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
          form.resetFields();
        }}
        onOk={() => document.getElementById("workerSubmitBtn").click()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (vals) => {
            // Ensure phone is stored as 10 digits only (strip any +91 prefix)
            const cleanedVals = {
              ...vals,
              phone: vals.phone?.replace(/^\+91\s*/, "") || vals.phone,
            };

            if (edit) {
              await updateItem("workers", edit.id, cleanedVals);
              dispatch(updateWorker({ id: edit.id, ...cleanedVals }));
            } else {
              const res = await addItem("workers", cleanedVals);
              dispatch(addWorker({ id: res.id, ...cleanedVals }));
            }
            setOpen(false);
            setEdit(null);
            form.resetFields();
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Worker Name" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: "Please enter phone number" },
              { pattern: /^\d{10}$/, message: "Enter valid 10-digit number" },
            ]}
          >
            <Input
              placeholder="10-digit mobile number"
              prefix="+91"
              maxLength={10}
              inputMode="numeric"
            />
          </Form.Item>

          <Form.Item name="profession" label="Profession">
            <Input placeholder="Electrician, POP, Carpenter etc." />
          </Form.Item>

          <Form.Item name="rate" label="Rates" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <button id="workerSubmitBtn" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

import {
  Button,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
  Table,
  Tag,
} from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";

import dayjs from "dayjs";

import { selectSchedules } from "../store/schedulesSlice";
import { selectWorkers } from "../store/workersSlice";

import ProtectedAction from "../components/common/ProtectedAction";
import { addItem, deleteItem, updateItem } from "../firebaseService";

export default function PaymentSchedule() {
  const schedules = useSelector(selectSchedules);
  const workers = useSelector(selectWorkers);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  const columns = [
    {
      title: "Worker",
      dataIndex: "workerId",
      render: (id) => workers.find((w) => w.id === id)?.name || "-",
    },
    {
      title: "Phase",
      dataIndex: "phase",
      render: (p) => <b>{p}</b>,
    },
    { title: "Amount", dataIndex: "amount", render: (v) => `₹${v}` },
    { title: "Due Date", dataIndex: "dueDate" },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) =>
        s === "pending" ? (
          <Tag color="orange">Pending</Tag>
        ) : (
          <Tag color="green">Paid</Tag>
        ),
    },
    {
      title: "Actions",
      render: (_, r) => (
        <div className="flex gap-2">
          <ProtectedAction
            onAuthorized={() => {
              setEdit(r);
              setOpen(true);
            }}
          >
            <Button size="small">Edit</Button>
          </ProtectedAction>

          <ProtectedAction
            title="Passcode required to delete"
            onAuthorized={() => {
              Modal.confirm({
                title: "Delete schedule?",
                onOk: async () => {
                  await deleteItem("schedules", r.id);
                },
              });
            }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </ProtectedAction>

          {r.status === "pending" && (
            <Button
              size="small"
              type="primary"
              onClick={() =>
                updateItem("schedules", r.id, { ...r, status: "paid" })
              }
            >
              Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-2">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Payment Schedule</h1>

        <Button
          type="primary"
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
        >
          Add Schedule
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={schedules}
        columns={columns}
        className="bg-white p-2 rounded-lg shadow"
      />

      <Modal
        open={open}
        title={edit ? "Edit Schedule" : "Add Schedule"}
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("scheduleSubmitBtn").click()}
      >
        <Form
          layout="vertical"
          initialValues={
            edit
              ? { ...edit, dueDate: dayjs(edit.dueDate) }
              : { dueDate: dayjs() }
          }
          onFinish={async (vals) => {
            const payload = {
              workerId: vals.workerId,
              phase: vals.phase,
              amount: vals.amount || 0,
              status: edit?.status || "pending",
              dueDate: vals.dueDate.format("YYYY-MM-DD"),
            };

            if (edit) {
              await updateItem("schedules", edit.id, payload);
            } else {
              await addItem("schedules", payload);
            }

            setOpen(false);
            setEdit(null);
          }}
        >
          <Form.Item
            name="workerId"
            label="Worker"
            rules={[{ required: true }]}
          >
            <Select
              options={workers.map((w) => ({
                label: w.name,
                value: w.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="phase" label="Phase" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "Advance", label: "Advance" },
                { value: "Mid", label: "Mid" },
                { value: "Completion", label: "Completion" },
              ]}
            />
          </Form.Item>

          <Form.Item name="amount" label="Amount">
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <button
            id="scheduleSubmitBtn"
            type="submit"
            className="hidden"
          ></button>
        </Form>
      </Modal>
    </div>
  );
}

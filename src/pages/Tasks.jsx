import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
} from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import dayjs from "dayjs";

import {
  addTask,
  deleteTask,
  selectTasks,
  updateTask,
} from "../store/tasksSlice";
import { selectWorkers } from "../store/workersSlice";

import { addItem, deleteItem, updateItem } from "../firebaseService";

export default function Tasks() {
  const tasks = useSelector(selectTasks);
  const workers = useSelector(selectWorkers);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  const columns = [
    {
      title: "Task",
      dataIndex: "title",
    },
    {
      title: "Assigned To",
      dataIndex: "workerId",
      render: (id) => workers.find((w) => w.id === id)?.name || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) =>
        s === "pending" ? (
          <Tag color="orange">Pending</Tag>
        ) : (
          <Tag color="green">Completed</Tag>
        ),
    },
    { title: "Deadline", dataIndex: "deadline" },
    {
      title: "Actions",
      render: (_, r) => (
        <div className="flex gap-2">
          <Button
            size="small"
            onClick={() => {
              setEdit(r);
              setOpen(true);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete task?"
            onConfirm={async () => {
              await deleteItem("tasks", r.id);
              dispatch(deleteTask(r.id));
            }}
          >
            <Button danger size="small">
              Delete
            </Button>
          </Popconfirm>

          {r.status === "pending" && (
            <Button
              size="small"
              type="primary"
              onClick={async () => {
                await updateItem("tasks", r.id, { ...r, status: "completed" });
                dispatch(updateTask({ id: r.id, status: "completed" }));
              }}
            >
              Mark Done
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-2">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Tasks</h1>

        <Button
          type="primary"
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
        >
          Add Task
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={tasks}
        columns={columns}
        className="bg-white rounded-lg shadow"
      />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("taskSubmitBtn").click()}
        title={edit ? "Edit Task" : "Add Task"}
      >
        <Form
          layout="vertical"
          initialValues={
            edit
              ? { ...edit, deadline: dayjs(edit.deadline) }
              : { status: "pending", deadline: dayjs() }
          }
          onFinish={async (vals) => {
            const payload = {
              title: vals.title,
              workerId: vals.workerId,
              status: edit?.status || "pending",
              deadline: vals.deadline.format("YYYY-MM-DD"),
            };

            if (edit) {
              await updateItem("tasks", edit.id, payload);
              dispatch(updateTask({ id: edit.id, ...payload }));
            } else {
              const res = await addItem("tasks", payload);
              dispatch(addTask({ id: res.id, ...payload }));
            }

            setOpen(false);
            setEdit(null);
          }}
        >
          <Form.Item
            name="title"
            label="Task Title"
            rules={[{ required: true }]}
          >
            <Input placeholder="Example: Install wiring" />
          </Form.Item>

          <Form.Item
            name="workerId"
            label="Assign To"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select worker"
              options={workers.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="deadline"
            label="Deadline"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <button id="taskSubmitBtn" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

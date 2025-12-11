import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../components/common/PageHeader";
import {
  addTask,
  deleteTask,
  selectTasks,
  updateTask,
} from "../store/tasksSlice";
import { selectWorkers } from "../store/workersSlice";

export default function Tasks() {
  const tasks = useSelector(selectTasks);
  const workers = useSelector(selectWorkers);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  const columns = [
    { title: "Task", dataIndex: "name" },
    {
      title: "Worker",
      dataIndex: "workerId",
      render: (id) => workers.find((w) => w.id === id)?.name || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (t) => (
        <Tag
          color={
            t === "done" ? "green" : t === "in-progress" ? "blue" : "default"
          }
        >
          {t}
        </Tag>
      ),
    },
    { title: "Cost", dataIndex: "cost" },
    { title: "Start", dataIndex: "startDate" },
    { title: "End", dataIndex: "endDate" },
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
            title="Delete task?"
            onConfirm={() => dispatch(deleteTask(r.id))}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tasks"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
          >
            Add Task
          </Button>
        }
      />
      <div className="bg-white rounded-xl p-4 shadow">
        <Table rowKey="id" columns={columns} dataSource={tasks} />
      </div>

      <Modal
        open={open}
        title={edit ? "Edit Task" : "Add Task"}
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("taskSubmitAll").click()}
      >
        <Form
          layout="vertical"
          initialValues={edit || { status: "pending" }}
          onFinish={(vals) => {
            const payload = { ...edit, ...vals };
            if (edit) dispatch(updateTask(payload));
            else dispatch(addTask(payload));
            setOpen(false);
          }}
        >
          <Form.Item name="name" label="Task" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="workerId" label="Assign Worker">
            <Select
              options={workers.map((w) => ({ value: w.id, label: w.name }))}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "pending", label: "Pending" },
                { value: "in-progress", label: "In Progress" },
                { value: "done", label: "Done" },
              ]}
            />
          </Form.Item>
          <Form.Item name="cost" label="Cost">
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="endDate" label="End Date">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <button id="taskSubmitAll" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

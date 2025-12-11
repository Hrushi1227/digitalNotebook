import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";

import { addPayment, selectPayments } from "../store/paymentsSlice";
import {
  addTask,
  deleteTask,
  selectTasks,
  updateTask,
} from "../store/tasksSlice";
import { applyPaymentToWorker, selectWorkerById } from "../store/workersSlice";

export default function WorkerDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const worker = useSelector(selectWorkerById(id));
  const tasks = useSelector(selectTasks).filter((t) => t.workerId === id);
  const payments = useSelector(selectPayments).filter((p) => p.workerId === id);

  const [openPay, setOpenPay] = useState(false);
  const [openTask, setOpenTask] = useState(false);

  if (!worker) {
    return (
      <Card className="bg-white">
        <div>
          Worker not found. <Link to="/workers">Back</Link>
        </div>
      </Card>
    );
  }

  const pending = worker.totalAmount - worker.paidAmount;

  const taskColumns = [
    { title: "Task", dataIndex: "name" },
    { title: "Status", dataIndex: "status", render: (t) => <Tag>{t}</Tag> },
    { title: "Cost", dataIndex: "cost" },
    { title: "Start", dataIndex: "startDate" },
    { title: "End", dataIndex: "endDate" },
    {
      title: "Action",
      render: (_, r) => (
        <Space>
          <Button onClick={() => setOpenTask(r)}>Edit</Button>
          <Button danger onClick={() => dispatch(deleteTask(r.id))}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const paymentColumns = [
    { title: "Date", dataIndex: "date" },
    { title: "Amount", dataIndex: "amount" },
    { title: "Method", dataIndex: "method" },
    { title: "Phase", dataIndex: "phase" },
  ];

  return (
    <div className="space-y-4">
      {/* Worker Card */}
      <Card title={worker.name} className="shadow">
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Type">{worker.type}</Descriptions.Item>
          <Descriptions.Item label="Phone">
            {worker.phone || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Agreed">
            ₹ {worker.totalAmount}
          </Descriptions.Item>
          <Descriptions.Item label="Paid">
            ₹ {worker.paidAmount}
          </Descriptions.Item>
          <Descriptions.Item label="Pending" span={2}>
            ₹ {pending}
          </Descriptions.Item>
        </Descriptions>

        <div className="mt-4 flex gap-2">
          <Button type="primary" onClick={() => setOpenPay(true)}>
            Add Payment
          </Button>
          <Button onClick={() => setOpenTask({})}>Add Task</Button>
          <Link to="/workers">
            <Button>Back</Button>
          </Link>
        </div>
      </Card>

      {/* Tasks */}
      <Card title="Tasks" className="shadow">
        <Table rowKey="id" dataSource={tasks} columns={taskColumns} />
      </Card>

      {/* Payments */}
      <Card title="Payments" className="shadow">
        <Table rowKey="id" dataSource={payments} columns={paymentColumns} />
      </Card>

      {/* Payment Modal */}
      <Modal
        open={openPay}
        title="Add Payment"
        onCancel={() => setOpenPay(false)}
        onOk={() => document.getElementById("paymentSubmit").click()}
      >
        <Form
          layout="vertical"
          onFinish={(values) => {
            const payload = {
              ...values,
              date: values.date.format("YYYY-MM-DD"),
              workerId: id,
            };
            dispatch(addPayment(payload));
            dispatch(
              applyPaymentToWorker({ workerId: id, amount: values.amount })
            );
            setOpenPay(false);
          }}
        >
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" defaultValue={dayjs()} />
          </Form.Item>
          <Form.Item name="method" label="Method" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "UPI", label: "UPI" },
                { value: "Cash", label: "Cash" },
                { value: "Bank", label: "Bank" },
              ]}
            />
          </Form.Item>
          <Form.Item name="phase" label="Phase">
            <Select
              options={[
                { value: "Advance", label: "Advance" },
                { value: "Mid", label: "Mid" },
                { value: "Final", label: "Final" },
              ]}
            />
          </Form.Item>

          <button id="paymentSubmit" type="submit" className="hidden" />
        </Form>
      </Modal>

      {/* Task Modal */}
      <Modal
        open={!!openTask}
        title={openTask?.id ? "Edit Task" : "Add Task"}
        onCancel={() => setOpenTask(false)}
        onOk={() => document.getElementById("taskSubmit").click()}
      >
        <Form
          layout="vertical"
          initialValues={openTask?.id ? openTask : { status: "pending" }}
          onFinish={(values) => {
            const payload = {
              ...openTask,
              ...values,
              workerId: id,
            };
            if (openTask?.id) {
              dispatch(updateTask(payload));
            } else {
              dispatch(addTask(payload));
            }
            setOpenTask(false);
          }}
        >
          <Form.Item name="name" label="Task" rules={[{ required: true }]}>
            <Input />
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

          <button id="taskSubmit" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

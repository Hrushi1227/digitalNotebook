import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
} from "antd";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";

import { selectPayments } from "../store/paymentsSlice";
import { selectTasks } from "../store/tasksSlice";
import { selectWorkers } from "../store/workersSlice";

import ProtectedAction from "../components/common/ProtectedAction";
import { deleteItem, updateItem } from "../firebaseService";

export default function WorkerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const workers = useSelector(selectWorkers);
  const tasks = useSelector(selectTasks);
  const payments = useSelector(selectPayments);

  const worker = workers.find((w) => w.id === id);

  const [open, setOpen] = useState(false);

  if (!worker) {
    return (
      <div className="p-4">
        <h2 className="text-xl mb-4">Worker not found</h2>
        <Link to="/workers">
          <Button type="primary">Go Back</Button>
        </Link>
      </div>
    );
  }

  // Tasks assigned to worker
  const workerTasks = useMemo(
    () => tasks.filter((t) => t.workerId === id),
    [tasks, id]
  );

  // Payments to worker
  const workerPayments = useMemo(
    () => payments.filter((p) => p.workerId === id),
    [payments, id]
  );

  const totalPaid = workerPayments.reduce(
    (a, b) => a + Number(b.amount || 0),
    0
  );

  const taskColumns = [
    { title: "Task", dataIndex: "title" },
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
  ];

  const payColumns = [
    { title: "Amount", dataIndex: "amount", render: (v) => `₹${v}` },
    { title: "Date", dataIndex: "date" },
    { title: "Note", dataIndex: "note" },
  ];

  return (
    <div className="p-4">
      <Space className="mb-4">
        <Button onClick={() => navigate("/workers")}>Back</Button>

        <ProtectedAction onAuthorized={() => setOpen(true)}>
          <Button type="primary">Edit Worker</Button>
        </ProtectedAction>

        <ProtectedAction
          title="Passcode required to delete"
          onAuthorized={() => {
            Modal.confirm({
              title: "Delete worker?",
              onOk: async () => {
                await deleteItem("workers", id);
                navigate("/workers");
              },
            });
          }}
        >
          <Button danger>Delete</Button>
        </ProtectedAction>
      </Space>

      {/* Worker Details */}
      <Card className="mb-6 shadow">
        <Descriptions title="Worker Details" bordered column={1}>
          <Descriptions.Item label="Name">{worker.name}</Descriptions.Item>
          <Descriptions.Item label="Phone">{worker.phone}</Descriptions.Item>
          <Descriptions.Item label="Profession">
            {worker.profession}
          </Descriptions.Item>
          <Descriptions.Item label="Daily Rate">
            ₹{worker.rate}
          </Descriptions.Item>
          <Descriptions.Item label="Total Paid so far">
            <b>₹{totalPaid}</b>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tasks */}
      <Card className="mb-6 shadow" title="Assigned Tasks">
        <div style={{ overflowX: "auto" }}>
          <Table
            rowKey="id"
            dataSource={workerTasks}
            columns={taskColumns}
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      {/* Payments */}
      <Card className="shadow" title="Payment History">
        <div style={{ overflowX: "auto" }}>
          <Table
            rowKey="id"
            dataSource={workerPayments}
            columns={payColumns}
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        open={open}
        title="Edit Worker"
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("editWorkerBtn").click()}
      >
        <Form
          layout="vertical"
          initialValues={{
            name: worker.name,
            phone: worker.phone,
            rate: worker.rate,
            profession: worker.profession,
          }}
          onFinish={async (vals) => {
            await updateItem("workers", worker.id, vals);
            setOpen(false);
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>

          <Form.Item name="profession" label="Profession">
            <Input />
          </Form.Item>

          <Form.Item name="rate" label="Daily Rate">
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <button id="editWorkerBtn" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

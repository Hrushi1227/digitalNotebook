import {
  Button,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
  Table,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { addSchedule, selectSchedules } from "../store/schedulesSlice";
import { selectWorkers } from "../store/workersSlice";

export default function PaymentSchedule() {
  const schedules = useSelector(selectSchedules);
  const workers = useSelector(selectWorkers);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);

  const columns = [
    {
      title: "Worker",
      dataIndex: "workerId",
      render: (id) => workers.find((w) => w.id === id)?.name || "-",
    },
    { title: "Phase", dataIndex: "phase" },
    { title: "Due Date", dataIndex: "dueDate" },
    { title: "Amount", dataIndex: "amount" },
    { title: "Status", dataIndex: "status" },
  ];

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Payment Schedule</h1>
        <Button type="primary" onClick={() => setOpen(true)}>
          Add Schedule
        </Button>
      </div>

      <Table rowKey="id" dataSource={schedules} columns={columns} />

      <Modal
        open={open}
        title="Add Payment Schedule"
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("scheduleSubmit").click()}
      >
        <Form
          layout="vertical"
          onFinish={(vals) => {
            dispatch(
              addSchedule({
                ...vals,
                dueDate: vals.dueDate.format("YYYY-MM-DD"),
              })
            );
            setOpen(false);
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
                { label: "Advance", value: "Advance" },
                { label: "Mid", value: "Mid" },
                { label: "Completion", value: "Completion" },
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
            <DatePicker className="w-full" defaultValue={dayjs()} />
          </Form.Item>

          <button id="scheduleSubmit" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

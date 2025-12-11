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
      render: (id) => workers.find((w) => w.id === id)?.name,
    },
    { title: "Phase", dataIndex: "phase" },
    { title: "Due Date", dataIndex: "dueDate" },
    { title: "Amount", dataIndex: "amount" },
    { title: "Status", dataIndex: "status" },
  ];

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Add Schedule
      </Button>

      <Table rowKey="id" dataSource={schedules} columns={columns} />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("sched-submit").click()}
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
              options={workers.map((w) => ({ value: w.id, label: w.name }))}
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
            <InputNumber className="w-full" />
          </Form.Item>

          <Form.Item name="dueDate" label="Due Date">
            <DatePicker className="w-full" defaultValue={dayjs()} />
          </Form.Item>

          <button id="sched-submit" type="submit" className="hidden"></button>
        </Form>
      </Modal>
    </>
  );
}

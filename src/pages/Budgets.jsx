import { Card, InputNumber, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../components/common/PageHeader";
import { selectBudgets, setAllocation } from "../store/budgetsSlice";

export default function Budgets() {
  const dispatch = useDispatch();
  const data = useSelector(selectBudgets);

  const columns = [
    { title: "Category", dataIndex: "key" },
    {
      title: "Allocated ₹",
      dataIndex: "allocated",
      render: (v, r) => (
        <InputNumber
          value={v}
          min={0}
          onChange={(val) =>
            dispatch(setAllocation({ key: r.key, allocated: val }))
          }
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Budget Allocation" />
      <Card className="p-4">
        <Table
          rowKey="key"
          dataSource={data}
          columns={columns}
          pagination={false}
        />
      </Card>
    </div>
  );
}

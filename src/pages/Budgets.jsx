import { Card, InputNumber, Table } from "antd";
import { useSelector } from "react-redux";
import PageHeader from "../components/common/PageHeader";

import { updateItem } from "../firebaseService";
import { selectBudgets } from "../store/budgetsSlice";

export default function Budgets() {
  const budgets = useSelector(selectBudgets);

  const columns = [
    {
      title: "Category",
      dataIndex: "key",
    },
    {
      title: "Allocated (₹)",
      dataIndex: "allocated",
      render: (value, record) => (
        <InputNumber
          min={0}
          className="w-full"
          value={value}
          onChange={(val) => {
            updateItem("budgets", record.key, {
              ...record,
              allocated: val,
            });
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Budget Allocation" />

      <Card className="p-4 shadow-lg rounded-xl bg-white">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={budgets}
          pagination={false}
        />
      </Card>
    </div>
  );
}

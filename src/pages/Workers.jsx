import { Button, Popconfirm, Space, Table, Tag } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import AddWorkerModal from "../components/workers/AddWorkerModal";
import {
  addWorker,
  deleteWorker,
  selectWorkers,
  selectWorkerTotals,
  updateWorker,
} from "../store/workersSlice";

export default function Workers() {
  const workers = useSelector(selectWorkers);
  const totals = useSelector(selectWorkerTotals);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (t, r) => <Link to={`/workers/${r.id}`}>{t}</Link>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (t) => <Tag>{t}</Tag>,
    },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Agreed", dataIndex: "totalAmount", key: "totalAmount" },
    { title: "Paid", dataIndex: "paidAmount", key: "paidAmount" },
    {
      title: "Pending",
      key: "pending",
      render: (_, r) => (r.totalAmount || 0) - (r.paidAmount || 0),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setEdit(record);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete worker?"
            onConfirm={() => dispatch(deleteWorker(record.id))}
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
        title="Workers"
        extra={
          <Space>
            <div className="text-gray-600">
              Budget: <b>{totals.budget}</b> · Paid: <b>{totals.paid}</b> ·
              Pending: <b>{totals.pending}</b>
            </div>
            <Button
              type="primary"
              onClick={() => {
                setEdit(null);
                setOpen(true);
              }}
            >
              Add Worker
            </Button>
          </Space>
        }
      />
      <div className="bg-white rounded-xl p-4 shadow">
        <Table rowKey="id" columns={columns} dataSource={workers} />
      </div>
      <AddWorkerModal
        open={open}
        initialValues={edit || undefined}
        onCancel={() => setOpen(false)}
        onSubmit={(values) => {
          if (edit) dispatch(updateWorker({ id: edit.id, ...values }));
          else dispatch(addWorker(values));
          setOpen(false);
        }}
      />
    </div>
  );
}

import {
  DownloadOutlined,
  PhoneOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Link } from "react-router-dom";

import AdminOnly from "../components/common/AdminOnly";
import { addItem, deleteItem, updateItem } from "../firebaseService";
import { selectIsAdmin } from "../store/authSlice";
import { selectPayments } from "../store/paymentsSlice";
import {
  addWorker,
  deleteWorker,
  selectWorkers,
  updateWorker,
} from "../store/workersSlice";

export default function Workers() {
  const workers = useSelector(selectWorkers);
  const payments = useSelector(selectPayments);
  const dispatch = useDispatch();
  const isAdmin = useSelector(selectIsAdmin);

  // Calculate worker statistics
  const workerStats = useMemo(() => {
    const totalLabor = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );
    const activeWorkers = workers.filter((w) =>
      payments.some((p) => p.workerId === w.id)
    ).length;
    const totalWorkers = workers.length;

    return { totalLabor, activeWorkers, totalWorkers };
  }, [workers, payments]);

  const exportToCSV = () => {
    const csvData = workers.map((w) => {
      const workerPayments = payments.filter((p) => p.workerId === w.id);
      const totalPaid = workerPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );
      return {
        Name: w.name,
        Phone: `+91${w.phone}`,
        Profession: w.profession || "-",
        DailyRate: w.rate,
        TotalPaid: totalPaid,
        PaymentCount: workerPayments.length,
      };
    });

    const headers = [
      "Name",
      "Phone",
      "Profession",
      "DailyRate",
      "TotalPaid",
      "PaymentCount",
    ];
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `workers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form] = Form.useForm();

  // Pre-fill form when editing, reset when adding
  useEffect(() => {
    if (open) {
      if (edit) {
        // Strip +91 prefix if present for editing
        const phoneValue = edit.phone?.replace(/^\+91\s*/, "") || edit.phone;
        form.setFieldsValue({
          ...edit,
          phone: phoneValue,
        });
      } else {
        form.resetFields();
      }
    }
    // form is stable from Form.useForm(), safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, edit]);

  const columns = [
    {
      title: "Worker Name",
      dataIndex: "name",
      width: 180,
      render: (text, r) => (
        <Link
          className="text-blue-600 font-medium hover:text-blue-800"
          to={`/workers/${r.id}`}
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Contact",
      dataIndex: "phone",
      width: 140,
      render: (phone) =>
        phone ? (
          <span className="text-gray-700">
            <PhoneOutlined className="mr-1" />
            +91{phone}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Profession",
      dataIndex: "profession",
      width: 150,
      render: (prof) =>
        prof ? <Tag color="blue">{prof}</Tag> : <Tag>Not specified</Tag>,
    },
    {
      title: "Daily Rate",
      dataIndex: "rate",
      width: 120,
      render: (rate) => (
        <span className="font-semibold text-green-600">
          ₹{rate?.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Total Paid",
      key: "totalPaid",
      width: 130,
      render: (_, r) => {
        const workerPayments = payments.filter((p) => p.workerId === r.id);
        const total = workerPayments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0
        );
        return <span className="font-bold">₹{total.toLocaleString()}</span>;
      },
    },
    {
      title: "Payments",
      key: "paymentCount",
      width: 100,
      render: (_, r) => {
        const count = payments.filter((p) => p.workerId === r.id).length;
        return <Tag color={count > 0 ? "green" : "default"}>{count}</Tag>;
      },
    },

    ...(isAdmin
      ? [
          {
            title: "Actions",
            render: (_, r) => (
              <AdminOnly
                onEdit={() => {
                  setEdit(r);
                  setOpen(true);
                }}
                onDelete={async () => {
                  try {
                    await deleteItem("workers", r.id);
                    dispatch(deleteWorker(r.id));
                  } catch (error) {
                    console.error("Failed to delete worker:", error);
                  }
                }}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-0 sm:p-2 md:p-4">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 px-2 sm:px-0">
        Workers & Labor Management
      </h1>

      {/* Statistics Cards */}
      <div className="px-2 sm:px-0 mb-4">
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Workers"
                value={workerStats.totalWorkers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#1890ff", fontSize: "28px" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card>
              <Statistic
                title="Active Workers"
                value={workerStats.activeWorkers}
                valueStyle={{ color: "#52c41a", fontSize: "28px" }}
                suffix={`/ ${workerStats.totalWorkers}`}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card>
              <Statistic
                title="Total Labor Cost"
                value={workerStats.totalLabor}
                prefix="₹"
                valueStyle={{ color: "#cf1322", fontSize: "24px" }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Action Buttons */}
      <div className="px-2 sm:px-0 mb-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Click on worker name to view details and payment history
          </div>
          <div className="flex gap-2">
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToCSV}
              disabled={workers.length === 0}
              size="large"
            >
              <span className="hidden sm:inline">Export</span>
            </Button>
            {isAdmin && (
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setEdit(null);
                  setOpen(true);
                }}
              >
                + Add Worker
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="px-2 sm:px-0">
        <Card>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <Table
              rowKey="id"
              dataSource={workers}
              columns={columns}
              scroll={{ x: "max-content" }}
              pagination={{ pageSize: 10 }}
            />
          </div>
        </Card>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={open}
        title={edit ? "Edit Worker Details" : "Add New Worker"}
        onCancel={() => {
          setOpen(false);
          setEdit(null);
          form.resetFields();
        }}
        onOk={() => document.getElementById("workerSubmitBtn").click()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (vals) => {
            // Ensure phone is stored as 10 digits only (strip any +91 prefix)
            const cleanedVals = {
              ...vals,
              phone: vals.phone?.replace(/^\+91\s*/, "") || vals.phone,
            };

            if (edit) {
              await updateItem("workers", edit.id, cleanedVals);
              dispatch(updateWorker({ id: edit.id, ...cleanedVals }));
            } else {
              const res = await addItem("workers", cleanedVals);
              dispatch(addWorker({ id: res.id, ...cleanedVals }));
            }
            setOpen(false);
            setEdit(null);
            form.resetFields();
          }}
        >
          <Form.Item
            name="name"
            label="Worker Name"
            rules={[{ required: true, message: "Please enter worker name" }]}
          >
            <Input placeholder="e.g., Rajesh Kumar" size="large" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Mobile Number"
            rules={[
              { required: true, message: "Please enter phone number" },
              { pattern: /^\d{10}$/, message: "Enter valid 10-digit number" },
            ]}
          >
            <Input
              placeholder="10-digit mobile number"
              prefix="+91"
              maxLength={10}
              inputMode="numeric"
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="profession"
                label="Profession/Trade"
                rules={[
                  { required: true, message: "Please select profession" },
                ]}
              >
                <Select
                  placeholder="Select profession"
                  size="large"
                  showSearch
                  options={[
                    { value: "Electrician" },
                    { value: "Plumber" },
                    { value: "Carpenter" },
                    { value: "Painter" },
                    { value: "Mason" },
                    { value: "POP Worker" },
                    { value: "Tile Worker" },
                    { value: "Welder" },
                    { value: "Helper" },
                    { value: "Supervisor" },
                    { value: "Other" },
                  ]}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="rate"
                label="Daily Rate (₹)"
                rules={[{ required: true, message: "Please enter daily rate" }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  placeholder="500"
                  size="large"
                  prefix="₹"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="text-xs text-gray-500 mt-2">
            💡 Tip: Worker can login using their mobile number to view work
            details
          </div>

          <button id="workerSubmitBtn" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

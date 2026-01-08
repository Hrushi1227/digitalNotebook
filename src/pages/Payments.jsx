import {
  CalendarOutlined,
  ClearOutlined,
  DollarOutlined,
  DownloadOutlined,
  FallOutlined,
  RiseOutlined,
  SearchOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

import {
  addPayment,
  deletePayment,
  selectPayments,
} from "../store/paymentsSlice";
import { selectWorkers } from "../store/workersSlice";

import ProtectedAction from "../components/common/ProtectedAction";
import { addItem, deleteItem } from "../firebaseService";

export default function Payments() {
  const payments = useSelector(selectPayments);
  const workers = useSelector(selectWorkers);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [amountRange, setAmountRange] = useState({ min: null, max: null });
  const [timeFilter, setTimeFilter] = useState("all");

  const paymentsUnique = useMemo(() => {
    // keep last occurrence for each id
    return Array.from(new Map(payments.map((p) => [p.id, p])).values());
  }, [payments]);

  // Filtered payments based on search and filters
  const filteredPayments = useMemo(() => {
    let filtered = [...paymentsUnique];

    // Time filter
    if (timeFilter !== "all") {
      const now = dayjs();
      filtered = filtered.filter((p) => {
        const paymentDate = dayjs(p.date);
        if (timeFilter === "today") {
          return paymentDate.isSame(now, "day");
        } else if (timeFilter === "week") {
          return paymentDate.isAfter(now.subtract(7, "day"));
        } else if (timeFilter === "month") {
          return paymentDate.isSame(now, "month");
        } else if (timeFilter === "year") {
          return paymentDate.isSame(now, "year");
        }
        return true;
      });
    }

    // Search filter
    if (searchText) {
      filtered = filtered.filter((p) => {
        const worker = workers.find((w) => w.id === p.workerId);
        const workerName = worker?.name?.toLowerCase() || "";
        const note = p.note?.toLowerCase() || "";
        const search = searchText.toLowerCase();
        return workerName.includes(search) || note.includes(search);
      });
    }

    // Worker filter
    if (selectedWorker) {
      filtered = filtered.filter((p) => p.workerId === selectedWorker);
    }

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((p) => {
        const paymentDate = dayjs(p.date);
        return paymentDate.isBetween(dateRange[0], dateRange[1], "day", "[]");
      });
    }

    // Amount range filter
    if (amountRange.min !== null) {
      filtered = filtered.filter((p) => Number(p.amount) >= amountRange.min);
    }
    if (amountRange.max !== null) {
      filtered = filtered.filter((p) => Number(p.amount) <= amountRange.max);
    }

    return filtered;
  }, [
    paymentsUnique,
    searchText,
    selectedWorker,
    dateRange,
    amountRange,
    timeFilter,
    workers,
  ]);

  const totalSpent = useMemo(() => {
    return paymentsUnique.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [paymentsUnique]);

  const filteredTotalSpent = useMemo(() => {
    return filteredPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
  }, [filteredPayments]);

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const thisMonthPayments = paymentsUnique.filter((p) => {
      const paymentDate = new Date(p.date);
      return (
        paymentDate.getMonth() === thisMonth &&
        paymentDate.getFullYear() === thisYear
      );
    });

    const thisMonthTotal = thisMonthPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
    const avgPayment =
      paymentsUnique.length > 0
        ? Math.round(totalSpent / paymentsUnique.length)
        : 0;

    // Get last payment date
    const sortedPayments = [...paymentsUnique].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const lastPaymentDate =
      sortedPayments.length > 0 ? sortedPayments[0].date : null;

    // Calculate previous month for comparison
    const lastMonth = new Date().getMonth() - 1;
    const lastMonthYear = lastMonth < 0 ? thisYear - 1 : thisYear;
    const lastMonthActual = lastMonth < 0 ? 11 : lastMonth;

    const lastMonthPayments = paymentsUnique.filter((p) => {
      const paymentDate = new Date(p.date);
      return (
        paymentDate.getMonth() === lastMonthActual &&
        paymentDate.getFullYear() === lastMonthYear
      );
    });

    const lastMonthTotal = lastMonthPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    const monthlyTrend =
      lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    // Top paying worker
    const workerPayments = {};
    paymentsUnique.forEach((p) => {
      if (!workerPayments[p.workerId]) {
        workerPayments[p.workerId] = 0;
      }
      workerPayments[p.workerId] += Number(p.amount);
    });
    const topWorkerEntry = Object.entries(workerPayments).sort(
      (a, b) => b[1] - a[1]
    )[0];
    const topWorkerId = topWorkerEntry?.[0];
    const topWorkerAmount = topWorkerEntry?.[1] || 0;

    return {
      thisMonthTotal,
      thisMonthCount: thisMonthPayments.length,
      avgPayment,
      lastPaymentDate,
      totalPayments: paymentsUnique.length,
      monthlyTrend,
      lastMonthTotal,
      topWorkerId,
      topWorkerAmount,
    };
  }, [paymentsUnique, totalSpent, workers]);

  const clearFilters = () => {
    setSearchText("");
    setSelectedWorker(null);
    setDateRange(null);
    setAmountRange({ min: null, max: null });
    setTimeFilter("all");
  };

  const hasActiveFilters =
    searchText ||
    selectedWorker ||
    dateRange ||
    amountRange.min !== null ||
    amountRange.max !== null ||
    timeFilter !== "all";

  const exportToCSV = () => {
    const csvData = filteredPayments.map((p) => ({
      Worker: workers.find((w) => w.id === p.workerId)?.name || "-",
      Amount: p.amount,
      Date: p.date,
      Note: p.note || "-",
    }));

    const headers = ["Worker", "Amount", "Date", "Note"];
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
    link.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const columns = [
    {
      title: "Payment Date",
      dataIndex: "date",
      width: 120,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: "descend",
      render: (date) => (
        <span>
          <CalendarOutlined className="mr-2 text-gray-400" />
          {date}
        </span>
      ),
    },
    {
      title: "Worker Name",
      dataIndex: "workerId",
      width: 180,
      render: (id) => {
        const worker = workers.find((w) => w.id === id);
        return worker ? (
          <Link to={`/workers/${id}`}>
            <Tag
              color="blue"
              className="text-sm cursor-pointer hover:opacity-80"
            >
              <UserOutlined className="mr-1" />
              {worker.name}
            </Tag>
          </Link>
        ) : (
          <span className="text-gray-400">Unknown</span>
        );
      },
    },
    {
      title: "Amount Paid",
      dataIndex: "amount",
      width: 150,
      sorter: (a, b) => a.amount - b.amount,
      render: (v) => (
        <span className="text-lg font-bold text-green-600">
          ₹{v?.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Note/Description",
      dataIndex: "note",
      ellipsis: true,
      render: (note) => (
        <Tooltip title={note}>
          <span className="text-gray-600">{note || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Action",
      render: (_, r) => (
        <ProtectedAction
          title="Passcode required to delete"
          onAuthorized={() => {
            Modal.confirm({
              title: "Delete payment?",
              onOk: async () => {
                await deleteItem("payments", r.id);
                dispatch(deletePayment(r.id));
              },
            });
          }}
        >
          <Button danger size="small">
            Delete
          </Button>
        </ProtectedAction>
      ),
    },
  ];

  return (
    <div className="p-0 sm:p-2 md:p-4">
      <div className="flex justify-between items-center mb-4 sm:mb-6 px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-semibold">
          💰 Payment Records & Transactions
        </h1>
        <Segmented
          options={[
            { label: "All", value: "all" },
            { label: "Today", value: "today" },
            { label: "Week", value: "week" },
            { label: "Month", value: "month" },
            { label: "Year", value: "year" },
          ]}
          value={timeFilter}
          onChange={setTimeFilter}
        />
      </div>

      {/* Statistics Dashboard */}
      <div className="px-2 sm:px-0 mb-4">
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Paid (All Time)"
                value={totalSpent}
                prefix="₹"
                valueStyle={{ color: "#cf1322", fontSize: "24px" }}
                suffix={
                  <span className="text-xs text-gray-400">
                    ({paymentStats.totalPayments} payments)
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="This Month"
                value={paymentStats.thisMonthTotal}
                prefix="₹"
                valueStyle={{ color: "#1890ff", fontSize: "24px" }}
                suffix={
                  <div>
                    <div className="text-xs text-gray-400">
                      ({paymentStats.thisMonthCount} payments)
                    </div>
                    {paymentStats.monthlyTrend !== 0 && (
                      <div
                        className={`text-xs ${
                          paymentStats.monthlyTrend > 0
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {paymentStats.monthlyTrend > 0 ? (
                          <RiseOutlined />
                        ) : (
                          <FallOutlined />
                        )}{" "}
                        {Math.abs(paymentStats.monthlyTrend).toFixed(1)}% vs
                        last month
                      </div>
                    )}
                  </div>
                }
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card>
              <Statistic
                title="Average Payment"
                value={paymentStats.avgPayment}
                prefix="₹"
                valueStyle={{ fontSize: "24px", color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card>
              <Statistic
                title="Last Payment"
                value={paymentStats.lastPaymentDate || "N/A"}
                valueStyle={{ fontSize: "18px", color: "#666" }}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Search and Filters */}
      <div className="px-2 sm:px-0 mb-4">
        <Card className="shadow-sm">
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Search by worker name or note..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size="large"
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Select
                  placeholder="Filter by worker"
                  value={selectedWorker}
                  onChange={setSelectedWorker}
                  allowClear
                  size="large"
                  style={{ width: "100%" }}
                  showSearch
                  filterOption={(input, option) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    ...workers.map((w) => ({
                      label: w.name,
                      value: w.id,
                    })),
                  ]}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  size="large"
                  style={{ width: "100%" }}
                  placeholder={["Start Date", "End Date"]}
                />
              </Col>
            </Row>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={16}>
                <Space>
                  {hasActiveFilters && (
                    <Badge count="Active">
                      <Button icon={<ClearOutlined />} onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </Badge>
                  )}
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={exportToCSV}
                    disabled={filteredPayments.length === 0}
                  >
                    Export{" "}
                    {filteredPayments.length < paymentsUnique.length
                      ? `(${filteredPayments.length})`
                      : ""}
                  </Button>
                  <Button
                    type="primary"
                    icon={<WalletOutlined />}
                    onClick={() => {
                      form.resetFields();
                      setOpen(true);
                    }}
                  >
                    Record Payment
                  </Button>
                </Space>
              </Col>
            </Row>
            {hasActiveFilters && (
              <div className="text-sm text-gray-500">
                Showing {filteredPayments.length} of {paymentsUnique.length}{" "}
                payments
                {filteredPayments.length !== paymentsUnique.length && (
                  <span className="ml-2 text-blue-600 font-semibold">
                    | Filtered Total: ₹{filteredTotalSpent.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </Space>
        </Card>
      </div>

      {/* Payments Table */}
      <div className="px-2 sm:px-0">
        <Card
          title={
            <Space>
              <span>Payment History</span>
              <Badge
                count={filteredPayments.length}
                style={{ backgroundColor: "#52c41a" }}
                showZero
              />
            </Space>
          }
          extra={
            <Space>
              <DollarOutlined />
              <span className="text-lg font-bold text-green-600">
                ₹{filteredTotalSpent.toLocaleString()}
              </span>
            </Space>
          }
        >
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <Table
              rowKey="id"
              dataSource={filteredPayments}
              columns={columns}
              scroll={{ x: "max-content" }}
              pagination={{
                pageSize: 15,
                showTotal: (total) => `Total ${total} payments`,
                showSizeChanger: true,
                pageSizeOptions: ["10", "15", "25", "50"],
              }}
              locale={{
                emptyText: hasActiveFilters
                  ? "No payments match your filters. Try adjusting your search criteria."
                  : "No payments recorded yet. Click 'Record Payment' to add your first payment.",
              }}
            />
          </div>
        </Card>
      </div>

      {/* Add Payment Modal */}
      <Modal
        open={open}
        title="💰 Record New Payment"
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        onOk={() => document.getElementById("paySubmitBtn").click()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ date: dayjs() }}
          onFinish={async (vals) => {
            const payload = {
              workerId: vals.workerId,
              amount: vals.amount,
              note: vals.note || "",
              date: vals.date.format("YYYY-MM-DD"),
              createdAt: new Date().toISOString(),
            };
            const res = await addItem("payments", payload);
            dispatch(addPayment({ id: res.id, ...payload }));

            setOpen(false);
            form.resetFields();
          }}
        >
          <Form.Item
            name="workerId"
            label="Select Worker"
            rules={[{ required: true, message: "Please select a worker" }]}
          >
            <Select
              placeholder="Choose worker to pay"
              size="large"
              showSearch
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={workers.map((w) => ({
                label: `${w.name} - ${w.profession || "Worker"} (₹${
                  w.rate
                }/day)`,
                value: w.id,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Payment Amount (₹)"
                rules={[
                  { required: true, message: "Please enter amount" },
                  {
                    type: "number",
                    min: 1,
                    message: "Amount must be greater than 0",
                  },
                ]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  placeholder="Enter amount"
                  size="large"
                  prefix="₹"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Payment Date"
                rules={[{ required: true, message: "Please select date" }]}
              >
                <DatePicker
                  className="w-full"
                  size="large"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Note/Description (Optional)">
            <Input.TextArea
              rows={3}
              placeholder="e.g., Week salary, Advance payment, Bonus, etc."
              maxLength={200}
              showCount
            />
          </Form.Item>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
            <strong>💡 Reminder:</strong> Always record payments immediately to
            maintain accurate financial records. Add notes for future reference.
          </div>

          <button id="paySubmitBtn" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

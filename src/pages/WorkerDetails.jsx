import {
  CalendarOutlined,
  EyeOutlined,
  PhoneOutlined,
  PrinterOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";

import { selectPayments } from "../store/paymentsSlice";
import { selectWorkers } from "../store/workersSlice";

import ProtectedAction from "../components/common/ProtectedAction";
import { deleteItem, updateItem } from "../firebaseService";

const { Title, Text } = Typography;

export default function WorkerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const workers = useSelector(selectWorkers);
  const payments = useSelector(selectPayments);

  const worker = workers.find((w) => w.id === id);

  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  // Payments to worker
  const workerPayments = useMemo(
    () => payments.filter((p) => p.workerId === id),
    [payments, id]
  );

  const totalPaid = workerPayments.reduce(
    (a, b) => a + Number(b.amount || 0),
    0
  );

  const payColumns = [
    {
      title: "Payment Date",
      dataIndex: "date",
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: "#1890ff" }} />
          {date}
        </Space>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (v) => (
        <span style={{ fontSize: "16px", fontWeight: "600", color: "#52c41a" }}>
          ₹{v?.toLocaleString()}
        </span>
      ),
    },
    { title: "Note", dataIndex: "note", ellipsis: true },
  ];

  const handlePrintBill = () => {
    const printWindow = window.open("", "", "width=900,height=700");
    const currentDate = new Date().toLocaleDateString("en-IN");
    const invoiceNumber = `INV-${worker.name
      .substring(0, 3)
      .toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${worker.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 30px;
              background: #fff;
              color: #333;
            }
            .invoice-container {
              max-width: 900px;
              margin: 0 auto;
              border: 2px solid #1890ff;
              padding: 0;
            }
            .invoice-header {
              background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .invoice-header h1 {
              font-size: 32px;
              margin-bottom: 5px;
              letter-spacing: 2px;
            }
            .invoice-header .subtitle {
              font-size: 14px;
              opacity: 0.9;
            }
            .invoice-meta {
              display: flex;
              justify-content: space-between;
              padding: 25px 30px;
              background: #f5f5f5;
              border-bottom: 2px solid #e0e0e0;
            }
            .meta-left, .meta-right {
              flex: 1;
            }
            .meta-left h3, .meta-right h3 {
              color: #1890ff;
              font-size: 14px;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .meta-left p, .meta-right p {
              margin: 6px 0;
              line-height: 1.6;
            }
            .meta-right {
              text-align: right;
            }
            .invoice-body {
              padding: 30px;
            }
            .section-title {
              color: #1890ff;
              font-size: 18px;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #1890ff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            thead {
              background: #1890ff;
              color: white;
            }
            th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e0e0e0;
            }
            tbody tr:hover {
              background-color: #f9f9f9;
            }
            .amount-cell {
              text-align: right;
              font-weight: 600;
              color: #52c41a;
              font-size: 15px;
            }
            .total-section {
              margin-top: 30px;
              padding: 20px;
              background: #e6f7ff;
              border-radius: 8px;
              border-left: 4px solid #1890ff;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 8px 0;
              font-size: 16px;
            }
            .total-row.grand-total {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #1890ff;
              font-size: 22px;
              font-weight: bold;
              color: #1890ff;
            }
            .invoice-footer {
              padding: 25px 30px;
              background: #f5f5f5;
              border-top: 2px solid #e0e0e0;
              text-align: center;
            }
            .footer-note {
              color: #666;
              font-size: 13px;
              line-height: 1.6;
              margin-bottom: 15px;
            }
            .footer-brand {
              color: #1890ff;
              font-weight: 600;
              font-size: 16px;
            }
            .worker-info-box {
              background: #fff;
              border: 1px solid #d9d9d9;
              border-radius: 6px;
              padding: 15px;
              margin-bottom: 25px;
            }
            .worker-info-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              padding: 8px 0;
              border-bottom: 1px dashed #e0e0e0;
            }
            .worker-info-row:last-child {
              border-bottom: none;
            }
            .worker-info-label {
              font-weight: 600;
              color: #666;
            }
            .worker-info-value {
              color: #333;
            }
            @media print {
              body { padding: 0; }
              .invoice-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="invoice-header">
              <h1>PAYMENT INVOICE</h1>
              <div class="subtitle">Professional Service Bill</div>
            </div>

            <!-- Invoice Meta -->
            <div class="invoice-meta">
              <div class="meta-left">
                <h3>Billed To:</h3>
                <p><strong>${worker.name}</strong></p>
                <p>Phone: +91${worker.phone}</p>
                <p>Profession: ${worker.profession}</p>
                <p>Rate: ₹${worker.rate}/day</p>
              </div>
              <div class="meta-right">
                <h3>Invoice Details:</h3>
                <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
                <p><strong>Date:</strong> ${currentDate}</p>
                <p><strong>Total Payments:</strong> ${workerPayments.length}</p>
              </div>
            </div>

            <!-- Body -->
            <div class="invoice-body">
              <h2 class="section-title">Payment History</h2>

              <table>
                <thead>
                  <tr>
                    <th style="width: 8%;">Sr. No.</th>
                    <th style="width: 20%;">Payment Date</th>
                    <th style="width: 18%; text-align: right;">Amount</th>
                    <th style="width: 54%;">Description / Note</th>
                  </tr>
                </thead>
                <tbody>
                  ${workerPayments
                    .map(
                      (payment, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${payment.date}</td>
                      <td class="amount-cell">₹${Number(
                        payment.amount
                      ).toLocaleString("en-IN")}</td>
                      <td>${payment.note || "—"}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <div class="total-section">
                <div class="total-row">
                  <span>Number of Payments:</span>
                  <span><strong>${workerPayments.length}</strong></span>
                </div>
                <div class="total-row">
                  <span>Average Payment:</span>
                  <span><strong>₹${
                    workerPayments.length > 0
                      ? Math.round(
                          totalPaid / workerPayments.length
                        ).toLocaleString("en-IN")
                      : 0
                  }</strong></span>
                </div>
                <div class="total-row grand-total">
                  <span>TOTAL AMOUNT PAID:</span>
                  <span>₹${totalPaid.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="invoice-footer">
              <div class="footer-note">
                This is a computer-generated invoice for payment records.<br>
                Generated on ${currentDate} | All amounts are in Indian Rupees (₹)
              </div>
              <div class="footer-brand">
                Breeza - Home Renovation Tracker
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  // Bill Preview Content Component
  const BillPreviewContent = () => {
    const currentDate = new Date().toLocaleDateString("en-IN");
    const invoiceNumber = `INV-${worker.name
      .substring(0, 3)
      .toUpperCase()}-${Date.now().toString().slice(-6)}`;

    return (
      <div style={{ padding: "20px" }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            color: "white",
            padding: "30px",
            textAlign: "center",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <Title level={2} style={{ color: "white", margin: 0 }}>
            PAYMENT INVOICE
          </Title>
          <Text style={{ color: "white", opacity: 0.9 }}>
            Professional Service Bill
          </Text>
        </div>

        {/* Invoice Meta */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "25px",
            background: "#f5f5f5",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div>
            <Text
              strong
              style={{
                color: "#1890ff",
                display: "block",
                marginBottom: "10px",
              }}
            >
              BILLED TO:
            </Text>
            <div>
              <strong>{worker.name}</strong>
            </div>
            <div>
              <PhoneOutlined /> +91{worker.phone}
            </div>
            <div>
              <UserOutlined /> {worker.profession}
            </div>
            <div>Rate: ₹{worker.rate}/day</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Text
              strong
              style={{
                color: "#1890ff",
                display: "block",
                marginBottom: "10px",
              }}
            >
              INVOICE DETAILS:
            </Text>
            <div>
              <strong>Invoice #:</strong> {invoiceNumber}
            </div>
            <div>
              <strong>Date:</strong> {currentDate}
            </div>
            <div>
              <strong>Total Payments:</strong> {workerPayments.length}
            </div>
          </div>
        </div>

        <Divider
          orientation="left"
          style={{ fontSize: "16px", fontWeight: "600" }}
        >
          Payment History
        </Divider>

        {/* Payments Table */}
        <Table
          dataSource={workerPayments}
          columns={[
            {
              title: "Sr. No.",
              render: (_, __, index) => index + 1,
              width: "10%",
            },
            { title: "Payment Date", dataIndex: "date", width: "25%" },
            {
              title: "Amount",
              dataIndex: "amount",
              width: "20%",
              render: (v) => (
                <span
                  style={{
                    color: "#52c41a",
                    fontWeight: "600",
                    fontSize: "15px",
                  }}
                >
                  ₹{Number(v).toLocaleString("en-IN")}
                </span>
              ),
            },
            {
              title: "Description / Note",
              dataIndex: "note",
              render: (v) => v || "—",
              ellipsis: true,
            },
          ]}
          pagination={false}
          size="small"
          scroll={{ y: 300 }}
        />

        {/* Totals */}
        <div
          style={{
            marginTop: "20px",
            background: "#e6f7ff",
            padding: "20px",
            borderRadius: "8px",
            borderLeft: "4px solid #1890ff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "8px 0",
            }}
          >
            <span>Number of Payments:</span>
            <strong>{workerPayments.length}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "8px 0",
            }}
          >
            <span>Average Payment:</span>
            <strong>
              ₹
              {workerPayments.length > 0
                ? Math.round(totalPaid / workerPayments.length).toLocaleString(
                    "en-IN"
                  )
                : 0}
            </strong>
          </div>
          <Divider style={{ margin: "12px 0" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "20px",
              fontWeight: "bold",
              color: "#1890ff",
            }}
          >
            <span>TOTAL AMOUNT PAID:</span>
            <span>₹{totalPaid.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Footer Note */}
        <div
          style={{
            marginTop: "25px",
            textAlign: "center",
            color: "#666",
            fontSize: "12px",
          }}
        >
          <div>This is a computer-generated invoice for payment records.</div>
          <div>
            Generated on {currentDate} | All amounts are in Indian Rupees (₹)
          </div>
          <div
            style={{
              marginTop: "10px",
              color: "#1890ff",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            Breeza - Home Renovation Tracker
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4">
      <Space className="mb-3 sm:mb-4 flex-wrap">
        <Button onClick={() => navigate("/workers")} size="small">
          Back
        </Button>

        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => setPreviewOpen(true)}
          size="small"
        >
          <span className="hidden sm:inline">Preview Bill</span>
        </Button>

        <Button
          type="default"
          icon={<PrinterOutlined />}
          onClick={handlePrintBill}
          size="small"
        >
          <span className="hidden sm:inline">Print Bill</span>
        </Button>

        <ProtectedAction onAuthorized={() => setOpen(true)}>
          <Button type="primary" size="small">
            Edit
          </Button>
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
          <Button danger size="small">
            Delete
          </Button>
        </ProtectedAction>
      </Space>

      {/* Worker Details */}
      <Card className="mb-3 sm:mb-6 shadow">
        <Descriptions title="Worker Details" bordered column={1} size="small">
          <Descriptions.Item label="Name">{worker.name}</Descriptions.Item>
          <Descriptions.Item label="Phone">
            <PhoneOutlined style={{ marginRight: "5px", color: "#1890ff" }} />
            +91{worker.phone}
          </Descriptions.Item>
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

      {/* Payments */}
      <Card
        className="shadow"
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <span>Payment History</span>
            <Space size="large">
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "normal",
                  color: "#666",
                }}
              >
                Total Payments:{" "}
                <strong style={{ color: "#1890ff" }}>
                  {workerPayments.length}
                </strong>
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "normal",
                  color: "#666",
                }}
              >
                Avg Payment:{" "}
                <strong style={{ color: "#52c41a" }}>
                  ₹
                  {workerPayments.length > 0
                    ? Math.round(
                        totalPaid / workerPayments.length
                      ).toLocaleString()
                    : 0}
                </strong>
              </span>
            </Space>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <Table
            rowKey="id"
            dataSource={workerPayments}
            columns={payColumns}
            pagination={
              workerPayments.length > 10
                ? { pageSize: 10, showSizeChanger: false }
                : false
            }
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "No payments recorded yet" }}
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
            phone: worker.phone?.replace(/^\+91\s*/, "") || worker.phone,
            rate: worker.rate,
            profession: worker.profession,
          }}
          onFinish={async (vals) => {
            // Ensure phone is stored as 10 digits only
            const cleanedVals = {
              ...vals,
              phone: vals.phone?.replace(/^\+91\s*/, "") || vals.phone,
            };
            await updateItem("workers", worker.id, cleanedVals);
            setOpen(false);
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
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
            />
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

      {/* Bill Preview Modal */}
      <Modal
        open={previewOpen}
        title={
          <span style={{ fontSize: "18px", fontWeight: "600" }}>
            Invoice Preview
          </span>
        }
        onCancel={() => setPreviewOpen(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              setPreviewOpen(false);
              handlePrintBill();
            }}
          >
            Print Invoice
          </Button>,
        ]}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        <BillPreviewContent />
      </Modal>
    </div>
  );
}

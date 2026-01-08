import { PrinterOutlined } from "@ant-design/icons";
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
} from "antd";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";

import { selectPayments } from "../store/paymentsSlice";
import { selectWorkers } from "../store/workersSlice";

import ProtectedAction from "../components/common/ProtectedAction";
import { deleteItem, updateItem } from "../firebaseService";

export default function WorkerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const workers = useSelector(selectWorkers);
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
    { title: "Amount", dataIndex: "amount", render: (v) => `₹${v}` },
    { title: "Date", dataIndex: "date" },
    { title: "Note", dataIndex: "note" },
  ];

  const handlePrintBill = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    const currentDate = new Date().toLocaleDateString();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Bill - ${worker.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #1890ff;
              border-bottom: 2px solid #1890ff;
              padding-bottom: 10px;
            }
            .header-info {
              margin: 20px 0;
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
            }
            .header-info p { margin: 5px 0; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #1890ff;
              color: white;
            }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .total-row {
              font-weight: bold;
              background-color: #e6f7ff !important;
              font-size: 16px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #888;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>Payment Bill</h1>
          <div class="header-info">
            <p><strong>Worker Name:</strong> ${worker.name}</p>
            <p><strong>Phone:</strong> +91${worker.phone}</p>
            <p><strong>Profession:</strong> ${worker.profession}</p>
            <p><strong>Daily Rate:</strong> ₹${worker.rate}</p>
            <p><strong>Bill Date:</strong> ${currentDate}</p>
          </div>

          <h2>Payment History</h2>
          <table>
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Date</th>
                <th>Amount (₹)</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${workerPayments
                .map(
                  (p, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${p.date || "N/A"}</td>
                  <td>₹${p.amount}</td>
                  <td>${p.note || "-"}</td>
                </tr>
              `
                )
                .join("")}
              <tr class="total-row">
                <td colspan="2">Total Paid</td>
                <td colspan="2">₹${totalPaid}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Generated on ${currentDate}</p>
            <p>Breeza - Home Renovation Tracker</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="p-2 sm:p-4">
      <Space className="mb-3 sm:mb-4 flex-wrap">
        <Button onClick={() => navigate("/workers")} size="small">
          Back
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
          <Descriptions.Item label="Phone">+91{worker.phone}</Descriptions.Item>
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
      <Card className="shadow" title="Payment History">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
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
    </div>
  );
}

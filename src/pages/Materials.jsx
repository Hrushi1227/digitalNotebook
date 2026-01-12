import {
  DownloadOutlined,
  InboxOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import {
  AutoComplete,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Upload,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProtectedAction from "../components/common/ProtectedAction";
import equipmentList from "../data/equipmentList.json";
import { addItem, deleteItem, updateItem } from "../firebaseService";

import { addDocument, selectDocuments } from "../store/documentsSlice";
import {
  addMaterial,
  deleteMaterial,
  selectMaterials,
  updateMaterial,
} from "../store/materialsSlice";

export default function Materials() {
  const materials = useSelector(selectMaterials);
  const documents = useSelector(selectDocuments);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [billFile, setBillFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Helper to get file type
  const getFileType = (mimeType) => {
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.includes("sheet") || mimeType.includes("excel"))
      return "Excel";
    return "Document";
  };

  // Auto-generate bill number
  const generateBillNumber = () => {
    const maxBillNumber = materials.reduce((max, mat) => {
      if (!mat.billNumber) return max;
      const match = mat.billNumber.match(/BILL-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `BILL-${String(maxBillNumber + 1).padStart(3, "0")}`;
  };

  // Load comprehensive equipment list from data file (users can still type custom names)
  // equipmentList.json contains categories with an `items` array each.
  const equipmentOptions = equipmentList.flatMap((cat) =>
    Array.isArray(cat.items) ? cat.items.map((item) => ({ value: item })) : []
  );

  const columns = [
    {
      title: "Item Name",
      dataIndex: "name",
      width: 200,
    },
    {
      title: "Price",
      dataIndex: "price",
      render: (v) => <b className="text-green-600">₹{v?.toLocaleString()}</b>,
      width: 120,
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (cat) => <Tag color="blue">{cat || "Other"}</Tag>,
      width: 120,
    },
    {
      title: "Vendor",
      dataIndex: "vendor",
      render: (v) => v || "-",
      width: 150,
    },
    {
      title: "Bill No.",
      dataIndex: "billNumber",
      render: (v, record) => {
        if (v && record.documentId) {
          return (
            <a
              onClick={() => handlePreviewBill(record)}
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {v}
            </a>
          );
        }
        return v || "-";
      },
      width: 100,
    },
    {
      title: "Date",
      dataIndex: "date",
      width: 110,
    },
    {
      title: "Note",
      dataIndex: "note",
      render: (v) => v || "-",
      ellipsis: true,
    },
    {
      title: "Action",
      render: (_, r) => (
        <Space>
          <ProtectedAction
            onAuthorized={() => {
              setEdit(r);
              setOpen(true);
            }}
          >
            <Button>Edit</Button>
          </ProtectedAction>

          <ProtectedAction
            title="Passcode required to delete"
            onAuthorized={() => {
              Modal.confirm({
                title: "Delete material?",
                onOk: async () => {
                  await deleteItem("materials", r.id);
                  dispatch(deleteMaterial(r.id));
                },
              });
            }}
          >
            <Button danger>Delete</Button>
          </ProtectedAction>
        </Space>
      ),
    },
  ];

  const total = materials.reduce((a, m) => a + Number(m.price || 0), 0);

  // Calculate category-wise spending
  const categoryTotals = materials.reduce((acc, m) => {
    const cat = m.category || "Other";
    acc[cat] = (acc[cat] || 0) + Number(m.price || 0);
    return acc;
  }, {});

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  // Handle bill preview
  const handlePreviewBill = async (material) => {
    if (!material.documentId) return;

    // Find document from store
    const doc = documents.find((d) => d.id === material.documentId);

    if (doc) {
      setPreviewDoc(doc);
      setPreviewOpen(true);
    } else {
      message.error("Document not found");
    }
  };

  // Handle bill file upload
  const handleBillUpload = async (file) => {
    const MAX_FILE_SIZE = 900 * 1024; // 900KB
    if (file.size > MAX_FILE_SIZE) {
      message.error(
        `File too large. Maximum size is ${(MAX_FILE_SIZE / 1024).toFixed(
          0
        )}KB.`
      );
      return false;
    }

    let mimeType = file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();

    // Handle missing MIME types
    if (
      !mimeType ||
      mimeType === "" ||
      mimeType === "application/octet-stream"
    ) {
      const extMap = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
      mimeType = extMap[ext] || mimeType;
    }

    const ALLOWED_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!ALLOWED_TYPES.includes(mimeType)) {
      message.error("Only PDF, Images, and Excel files are allowed");
      return false;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      setBillFile({
        name: file.name,
        type: mimeType,
        size: file.size,
        dataUrl: e.target.result,
      });
      message.success(`${file.name} ready to upload`);
    };
    reader.readAsDataURL(file);

    return false; // Prevent auto upload
  };

  const exportToCSV = () => {
    const csvData = materials.map((m) => ({
      Name: m.name,
      Price: m.price,
      Category: m.category || "-",
      Vendor: m.vendor || "-",
      BillNumber: m.billNumber || "-",
      Date: m.date,
      Note: m.note || "-",
    }));

    const headers = [
      "Name",
      "Price",
      "Category",
      "Vendor",
      "BillNumber",
      "Date",
      "Note",
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
    link.download = `materials_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-0 sm:p-2 md:p-4">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 px-2 sm:px-0">
        Materials & Purchases
      </h1>

      {/* Summary Cards */}
      <div className="px-2 sm:px-0 mb-4">
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Spent"
                value={total}
                prefix="₹"
                valueStyle={{ color: "#cf1322", fontSize: "24px" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Items"
                value={materials.length}
                prefix={<ShoppingOutlined />}
                valueStyle={{ fontSize: "24px" }}
              />
            </Card>
          </Col>
          {topCategories.slice(0, 2).map(([cat, amount]) => (
            <Col xs={12} sm={12} md={6} key={cat}>
              <Card>
                <Statistic
                  title={`${cat} Cost`}
                  value={amount}
                  prefix="₹"
                  valueStyle={{ fontSize: "18px", color: "#1890ff" }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Action Buttons */}
      <div className="px-2 sm:px-0 mb-4">
        <Space>
          <Button
            type="primary"
            size="large"
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
          >
            + Add Purchase
          </Button>
          <Button
            icon={<DownloadOutlined />}
            size="large"
            onClick={exportToCSV}
            disabled={materials.length === 0}
          >
            Export
          </Button>
        </Space>
      </div>

      {/* Materials Table */}
      <div className="px-2 sm:px-0">
        <Card>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <Table
              rowKey="id"
              dataSource={materials}
              columns={columns}
              scroll={{ x: "max-content" }}
              pagination={{ pageSize: 10 }}
            />
          </div>
        </Card>
      </div>

      <Modal
        open={open}
        title={edit ? "Edit Purchase" : "Add New Purchase"}
        onCancel={() => {
          setOpen(false);
          setBillFile(null);
        }}
        onOk={() => document.getElementById("matSubmit").click()}
        width={600}
      >
        <Form
          layout="vertical"
          initialValues={
            edit
              ? { ...edit, date: edit.date ? dayjs(edit.date) : dayjs() }
              : { date: dayjs(), category: "Other" }
          }
          onFinish={async (vals) => {
            try {
              const payload = {
                ...vals,
                date: vals.date.format("YYYY-MM-DD"),
              };

              if (edit) {
                await updateItem("materials", edit.id, payload);
                dispatch(updateMaterial({ id: edit.id, ...payload }));
                message.success("Material updated successfully");
              } else {
                // Auto-generate bill number if bill is uploaded
                if (billFile && !vals.billNumber) {
                  payload.billNumber = generateBillNumber();
                }

                // Add material first
                const materialRes = await addItem("materials", payload);

                // If bill file is uploaded, create document
                let documentId = null;
                if (billFile) {
                  const docPayload = {
                    name: `Bill for ${vals.name}`,
                    type: billFile.type,
                    fileType: getFileType(billFile.type),
                    size: billFile.size,
                    uploadedAt: new Date().toISOString(),
                    dataUrl: billFile.dataUrl,
                    visibility: "private",
                    assignedWorkers: [],
                    materialId: materialRes.id, // Link to material
                    billNumber: payload.billNumber,
                  };

                  const docRes = await addItem("documents", docPayload);
                  documentId = docRes.id;
                  dispatch(addDocument({ id: docRes.id, ...docPayload }));

                  // Update material with document ID
                  await updateItem("materials", materialRes.id, { documentId });
                  payload.documentId = documentId;
                }

                dispatch(addMaterial({ id: materialRes.id, ...payload }));
                message.success("Material added successfully");
              }

              setOpen(false);
              setBillFile(null);
            } catch (error) {
              message.error("Failed to save material: " + error.message);
              console.error("Material save error:", error);
            }
          }}
        >
          <Form.Item
            name="name"
            label="Item Name"
            rules={[{ required: true, message: "Please enter item name" }]}
          >
            <AutoComplete
              options={equipmentOptions}
              placeholder="e.g., Cement bag, Paint bucket, Electrical wire"
              filterOption={(inputValue, option) =>
                option.value.toLowerCase().includes(inputValue.toLowerCase())
              }
              allowClear
              notFoundContent={null}
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price (₹)"
                rules={[{ required: true, message: "Please enter price" }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  placeholder="0"
                  size="large"
                  prefix="₹"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={[
                    { value: "Cement & Sand" },
                    { value: "POP & Plaster" },
                    { value: "Electrical" },
                    { value: "Paint" },
                    { value: "Wood & Furniture" },
                    { value: "Plumbing" },
                    { value: "Tiles & Flooring" },
                    { value: "Hardware" },
                    { value: "Other" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="vendor" label="Vendor/Shop Name">
                <Input placeholder="Shop or supplier name" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="billNumber" label="Bill/Invoice No.">
                <Input placeholder="Optional" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="date"
            label="Purchase Date"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" size="large" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="note" label="Note/Description">
            <Input.TextArea
              rows={2}
              placeholder="Additional details (optional)"
              maxLength={200}
              showCount
            />
          </Form.Item>

          {/* Bill Upload - Only for new materials */}
          {!edit && (
            <Form.Item label="Upload Bill (Optional)">
              <Upload.Dragger
                beforeUpload={handleBillUpload}
                onRemove={() => setBillFile(null)}
                maxCount={1}
                accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
                fileList={
                  billFile
                    ? [{ uid: "-1", name: billFile.name, status: "done" }]
                    : []
                }
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to upload</p>
                <p className="ant-upload-hint">
                  Support: PDF, Images, Excel files (max 900KB)
                </p>
              </Upload.Dragger>
              {billFile && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ {billFile.name} ready to upload
                </div>
              )}
            </Form.Item>
          )}

          <button id="matSubmit" type="submit" className="hidden" />
        </Form>
      </Modal>

      {/* Bill Preview Modal */}
      <Modal
        open={previewOpen}
        title={previewDoc?.name}
        onCancel={() => {
          setPreviewOpen(false);
          setPreviewDoc(null);
        }}
        footer={null}
        width="100%"
        style={{
          top: 0,
          paddingBottom: 0,
          maxWidth: window.innerWidth > 768 ? "900px" : "100vw",
        }}
        styles={{
          body: {
            maxHeight: "80vh",
            overflowY: "auto",
            padding: window.innerWidth > 768 ? "24px" : "12px",
          },
        }}
        centered={window.innerWidth > 768}
      >
        {previewDoc && (
          <div
            className="bg-gray-100 rounded"
            style={{ padding: window.innerWidth > 768 ? "16px" : "8px" }}
          >
            {previewDoc.fileType === "Image" ? (
              <div className="flex justify-center">
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  style={{
                    maxHeight: window.innerWidth > 768 ? "600px" : "70vh",
                    maxWidth: "100%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    margin: "0 auto",
                    display: "block",
                    touchAction: "pinch-zoom",
                    cursor: window.innerWidth <= 768 ? "pointer" : "default",
                  }}
                  onClick={(e) => {
                    if (window.innerWidth <= 768) {
                      window.open(previewDoc.dataUrl, "_blank");
                    }
                  }}
                />
              </div>
            ) : previewDoc.fileType === "PDF" ? (
              <div style={{ position: "relative", width: "100%" }}>
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.name}
                  style={{
                    width: "100%",
                    height: window.innerWidth > 768 ? "600px" : "70vh",
                    border: "none",
                    borderRadius: "4px",
                  }}
                />
                {window.innerWidth <= 768 && (
                  <>
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: "12px",
                        padding: "8px",
                        background: "#fff7e6",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#d46b08",
                      }}
                    >
                      ⚠️ For better PDF viewing, download or open in full screen
                    </div>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = previewDoc.dataUrl;
                        link.download = previewDoc.name;
                        link.click();
                      }}
                      style={{ marginTop: "12px", width: "100%" }}
                      size="large"
                    >
                      Download
                    </Button>
                  </>
                )}
              </div>
            ) : previewDoc.fileType === "Excel" ? (
              <div className="bg-white p-4 rounded text-center">
                <p className="text-gray-600 mb-4">
                  Excel preview not available. Download to view.
                </p>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = previewDoc.dataUrl;
                    link.download = previewDoc.name;
                    link.click();
                  }}
                >
                  Download {previewDoc.name}
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-600">
                <p>Preview not available</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

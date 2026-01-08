import { DownloadOutlined, ShoppingOutlined } from "@ant-design/icons";
import {
  AutoComplete,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProtectedAction from "../components/common/ProtectedAction";
import equipmentList from "../data/equipmentList.json";
import { addItem, deleteItem, updateItem } from "../firebaseService";

import {
  addMaterial,
  deleteMaterial,
  selectMaterials,
  updateMaterial,
} from "../store/materialsSlice";

export default function Materials() {
  const materials = useSelector(selectMaterials);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

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
      render: (v) => v || "-",
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
    .slice(0, 3);

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
        onCancel={() => setOpen(false)}
        onOk={() => document.getElementById("matSubmit").click()}
        width={600}
      >
        <Form
          layout="vertical"
          initialValues={edit || { date: dayjs(), category: "Other" }}
          onFinish={async (vals) => {
            const payload = {
              ...vals,
              date: vals.date.format("YYYY-MM-DD"),
            };

            if (edit) {
              await updateItem("materials", edit.id, payload);
              dispatch(updateMaterial({ id: edit.id, ...payload }));
            } else {
              const res = await addItem("materials", payload);
              dispatch(addMaterial({ id: res.id, ...payload }));
            }

            setOpen(false);
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

          <button id="matSubmit" type="submit" className="hidden" />
        </Form>
      </Modal>
    </div>
  );
}

import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
} from "antd";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsAdmin } from "../../store/authSlice";
import {
  addParking,
  deleteParking,
  listenParking,
  selectParking,
  updateParking,
} from "../../store/parkingSlice";

const parkingTypes = ["Car", "Bike"];

export default function ParkingTab() {
  // ...existing code...

  const dispatch = useDispatch();
  const data = useSelector(selectParking);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [filter, setFilter] = useState({ status: "all", flat: "", owner: "" });
  const isAdmin = useSelector(selectIsAdmin);

  // Listen to Firestore parking collection on mount (Redux)
  useEffect(() => {
    const unsubscribe = dispatch(listenParking());
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch]);

  // --- DEBUG: Direct Firestore listener ---
  useEffect(() => {
    const db = getFirestore();
    const colRef = collection(db, "parking");
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        console.log(
          "[DEBUG] Firestore direct listener fired",
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (error) => {
        console.error("[DEBUG] Firestore direct listener error", error);
      }
    );
    return () => unsub();
  }, []);

  // Summary stats
  const total = data.length;
  const owned = data.filter((d) => d.status === "Occupied").length;
  const rented = data.filter((d) => d.status === "Rented").length;
  const vacant = data.filter((d) => d.status === "Vacant").length;
  const totalCarStickers = data.reduce(
    (sum, d) =>
      sum +
      (d.vehicles
        ?.filter((v) => v.type === "Car")
        .reduce((s, v) => s + (v.stickerCount || 0), 0) || 0),
    0
  );
  const totalBikeStickers = data.reduce(
    (sum, d) =>
      sum +
      (d.vehicles
        ?.filter((v) => v.type === "Bike")
        .reduce((s, v) => s + (v.stickerCount || 0), 0) || 0),
    0
  );

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      // Ensure vehicles is always an array
      if (!Array.isArray(values.vehicles)) values.vehicles = [];
      // Ensure documents is always an object with all keys
      values.documents = {
        possession: !!(values.documents && values.documents.possession),
        rentAgreement: !!(values.documents && values.documents.rentAgreement),
        idProof: !!(values.documents && values.documents.idProof),
        mygate: !!(values.documents && values.documents.mygate),
      };

      // Ensure isRented is always boolean (never undefined)
      if (typeof values.isRented !== "boolean") values.isRented = false;

      // Ensure notes is always a string (never undefined)
      if (typeof values.notes !== "string") values.notes = "";

      if (!values.flat && !values.owner) {
        // Vacant slot
        values.status = "Vacant";
        values.isRented = false;
        values.rentedTo = "";
        values.rentAmount = "";
      } else if (!values.isRented) {
        values.rentedTo = "";
        values.rentAmount = "";
        values.status = "Occupied";
      } else {
        values.status = "Rented";
      }

      if (editing) {
        dispatch(updateParking({ id: editing.id, data: values }));
      } else {
        console.log("[DEBUG] Dispatching addParking", values);
        dispatch(addParking(values))
          .then((result) => {
            console.log("[DEBUG] addParking result", result);
          })
          .catch((err) => {
            console.error("[DEBUG] addParking error", err);
          });
      }
      setOpen(false);
    });
  };

  const handleDelete = (id) => {
    const entry = data.find((item) => item.id === id);
    // For owners: possession, idProof, mygate; for tenants: rentAgreement, idProof, mygate
    const requiredDocs = entry?.isRented
      ? [
          entry.documents?.rentAgreement,
          entry.documents?.idProof,
          entry.documents?.mygate,
        ]
      : [
          entry.documents?.possession,
          entry.documents?.idProof,
          entry.documents?.mygate,
        ];
    const allDocsPresent = requiredDocs.every(Boolean);
    if (!allDocsPresent) {
      Modal.confirm({
        title: "Missing required documents!",
        content:
          "This parking entry is missing required documents. Only an admin can confirm deletion. Are you sure you want to delete?",
        okText: "Delete Anyway",
        cancelText: "Cancel",
        onOk: () => dispatch(deleteParking(id)),
      });
    } else {
      dispatch(deleteParking(id));
    }
  };

  const columns = [
    { title: "Parking No", dataIndex: "parkingNo" },
    {
      title: "Owner Flat",
      dataIndex: "flat",
      render: (v) => v || <Tag color="gray">Vacant</Tag>,
    },
    {
      title: "Owner Name",
      dataIndex: "owner",
      render: (v) => v || <Tag color="gray">Vacant</Tag>,
    },
    {
      title: "Usage",
      render: (_, record) =>
        record.status === "Vacant" ? (
          <Tag color="default">Vacant</Tag>
        ) : record.isRented ? (
          <Tag color="orange">Rented</Tag>
        ) : (
          <Tag color="green">Self</Tag>
        ),
    },
    {
      title: "Rented To",
      dataIndex: "rentedTo",
      render: (v, rec) => (rec.status === "Rented" ? v : "-"),
    },
    {
      title: "Rent (₹)",
      dataIndex: "rentAmount",
      render: (v, rec) => (rec.status === "Rented" ? v : "-"),
    },
    {
      title: "Vehicles",
      dataIndex: "vehicles",
      render: (vehicles) =>
        vehicles && vehicles.length ? (
          vehicles.map((v, i) => (
            <div key={i}>
              <b>{v.type}</b>: {v.stickerCount || 0} sticker(s)
              {v.stickerNumbers ? ` [${v.stickerNumbers}]` : ""}
            </div>
          ))
        ) : (
          <span>-</span>
        ),
    },
    {
      title: "Documents",
      dataIndex: "documents",
      render: (docs, rec) => (
        <div>
          {rec.isRented ? (
            <>
              <span title="Rent Agreement">
                {docs?.rentAgreement ? "✅" : "❌"} Rent Agrmt
              </span>
              {" | "}
              <span title="ID Proof">{docs?.idProof ? "✅" : "❌"} ID</span>
              {" | "}
              <span title="Mygate ID">{docs?.mygate ? "✅" : "❌"} Mygate</span>
            </>
          ) : (
            <>
              <span title="Possession/Index 2">
                {docs?.possession ? "✅" : "❌"} Possn
              </span>
              {" | "}
              <span title="ID Proof">{docs?.idProof ? "✅" : "❌"} ID</span>
              {" | "}
              <span title="Mygate ID">{docs?.mygate ? "✅" : "❌"} Mygate</span>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      render: (v) => v || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => {
        if (s === "Rented") return <Tag color="blue">Rented</Tag>;
        if (s === "Vacant") return <Tag color="default">Vacant</Tag>;
        return <Tag color="green">Occupied</Tag>;
      },
    },
    ...(isAdmin
      ? [
          {
            title: "Actions",
            render: (_, record) => (
              <div className="flex gap-2">
                <Button size="small" onClick={() => openEdit(record)}>
                  Edit
                </Button>
                <Popconfirm
                  title="Delete this parking slot?"
                  okText="Delete"
                  cancelText="Cancel"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button danger size="small">
                    Delete
                  </Button>
                </Popconfirm>
              </div>
            ),
          },
        ]
      : []),
  ];

  // Filtering
  const filteredData = (data || []).filter((item) => {
    if (filter.status !== "all" && item.status !== filter.status) return false;
    if (
      filter.flat &&
      !(item.flat || "").toLowerCase().includes(filter.flat.toLowerCase())
    )
      return false;
    if (
      filter.owner &&
      !(item.owner || "").toLowerCase().includes(filter.owner.toLowerCase())
    )
      return false;
    return true;
  });

  // ...existing code...
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between mb-4 gap-2">
        <div>
          <h2 className="text-xl font-semibold">Parking Management</h2>
          <div className="flex gap-4 mt-2 text-sm">
            <span>
              Total: <b>{total}</b>
            </span>
            <span>
              Owned: <b>{owned}</b>
            </span>
            <span>
              Rented: <b>{rented}</b>
            </span>
            <span>
              Vacant: <b>{vacant}</b>
            </span>
            <span>
              Car Stickers: <b>{totalCarStickers}</b>
            </span>
            <span>
              Bike Stickers: <b>{totalBikeStickers}</b>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <Input
            placeholder="Filter by flat"
            size="small"
            value={filter.flat}
            onChange={(e) => setFilter((f) => ({ ...f, flat: e.target.value }))}
            style={{ width: 120 }}
          />
          <Input
            placeholder="Filter by owner"
            size="small"
            value={filter.owner}
            onChange={(e) =>
              setFilter((f) => ({ ...f, owner: e.target.value }))
            }
            style={{ width: 120 }}
          />
          <Select
            size="small"
            value={filter.status}
            onChange={(v) => setFilter((f) => ({ ...f, status: v }))}
            style={{ width: 110 }}
            options={[
              { value: "all", label: "All" },
              { value: "Occupied", label: "Owned" },
              { value: "Rented", label: "Rented" },
              { value: "Vacant", label: "Vacant" },
            ]}
          />
          {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Add Parking
            </Button>
          )}
        </div>
      </div>

      <Table columns={columns} dataSource={filteredData} rowKey="id" />

      {isAdmin && (
        <Modal
          title={editing ? "Edit Parking" : "Add Parking"}
          open={open}
          onCancel={() => setOpen(false)}
          onOk={handleSubmit}
          okText={editing ? "Update" : "Add"}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Parking Number"
              name="parkingNo"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Owner Flat (leave blank for vacant)" name="flat">
              <Input />
            </Form.Item>

            <Form.Item label="Owner Name (leave blank for vacant)" name="owner">
              <Input />
            </Form.Item>

            <Form.List name="vehicles">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="border p-2 mb-2 rounded">
                      <Form.Item
                        {...restField}
                        name={[name, "type"]}
                        label="Vehicle Type"
                        rules={[{ required: true }]}
                      >
                        <Select
                          options={parkingTypes.map((t) => ({ value: t }))}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "stickerCount"]}
                        label="Sticker Count"
                        rules={[{ required: true }]}
                      >
                        <Input type="number" min={0} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "stickerNumbers"]}
                        label="Sticker Numbers"
                      >
                        <Input placeholder="e.g. C-1234, B-111" />
                      </Form.Item>
                      <Button danger size="small" onClick={() => remove(name)}>
                        Remove Vehicle
                      </Button>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    + Add Vehicle
                  </Button>
                </>
              )}
            </Form.List>

            <Form.Item label="Notes" name="notes">
              <Input.TextArea rows={2} />
            </Form.Item>

            <Form.Item
              label="Is Parking Rented?"
              name="isRented"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              shouldUpdate={(prev, curr) => prev.isRented !== curr.isRented}
              noStyle
            >
              {({ getFieldValue }) =>
                getFieldValue("isRented") && (
                  <>
                    <Form.Item
                      label="Rented To (Flat / Name)"
                      name="rentedTo"
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      label="Monthly Rent (₹)"
                      name="rentAmount"
                      rules={[{ required: true }]}
                    >
                      <Input type="number" />
                    </Form.Item>
                  </>
                )
              }
            </Form.Item>

            <Form.Item label="Documents Shown">
              <Form.Item
                name={["documents", "possession"]}
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren="Possession/Index 2"
                  unCheckedChildren="Possession/Index 2"
                />
              </Form.Item>
              <Form.Item
                name={["documents", "rentAgreement"]}
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren="Rent Agreement"
                  unCheckedChildren="Rent Agreement"
                  className="ml-2"
                />
              </Form.Item>
              <Form.Item
                name={["documents", "idProof"]}
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren="ID Proof"
                  unCheckedChildren="ID Proof"
                  className="ml-2"
                />
              </Form.Item>
              <Form.Item
                name={["documents", "mygate"]}
                valuePropName="checked"
                noStyle
              >
                <Switch
                  checkedChildren="Mygate ID"
                  unCheckedChildren="Mygate ID"
                  className="ml-2"
                />
              </Form.Item>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
}

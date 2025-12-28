import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Table, Tag } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addItem, deleteItem, updateItem } from "../../firebaseService";
import { selectIsAdmin } from "../../store/authSlice";
import {
  addMember,
  deleteMember,
  selectMembers,
  updateMember,
} from "../../store/membersSlice";
import { addParking } from "../../store/parkingSlice";
import AdminOnly from "../common/AdminOnly";

const roles = ["Chairman", "Secretary", "Treasurer", "Member"];

export default function MembersTab() {
  const dispatch = useDispatch();
  const members = useSelector(selectMembers);
  const isAdmin = useSelector(selectIsAdmin);
  const [open, setOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form] = Form.useForm();

  const openAddModal = () => {
    setEditingMember(null);
    form.resetFields();
    setOpen(true);
  };

  const openEditModal = (record) => {
    setEditingMember(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMember) {
        // Update in Firestore
        await updateItem("members", editingMember.id, values);
        dispatch(updateMember({ ...editingMember, ...values }));
      } else {
        // Add to Firestore
        const docRef = await addItem("members", values);
        dispatch(addMember({ ...values, id: docRef.id }));

        // --- Add corresponding parking entry ---
        const parkingData = {
          parkingNo: values.flat,
          flat: values.flat,
          owner: values.name,
          vehicles: [],
          notes: "",
          isRented: false,
          rentedTo: "",
          rentAmount: "",
          documents: {
            possession: false,
            rentAgreement: false,
            idProof: false,
            mygate: false,
          },
          status: "Occupied",
        };
        dispatch(addParking(parkingData));
      }
      setOpen(false);
    } catch (e) {
      // handle error
    }
  };

  const handleDelete = async (record) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      await deleteItem("members", record.id);
      dispatch(deleteMember(record.id));
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Flat",
      dataIndex: "flat",
    },
    {
      title: "Phone",
      dataIndex: "phone",
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    ...(isAdmin
      ? [
          {
            title: "Actions",
            render: (_, record) => (
              <AdminOnly
                onEdit={() => openEditModal(record)}
                onDelete={() => handleDelete(record)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Society Members</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Member
        </Button>
      </div>

      {/* Desktop/tablet table view */}
      <div className="hidden sm:block">
        <Table columns={columns} dataSource={members} rowKey="id" />
      </div>

      {/* Mobile card view - edge-to-edge, no margin, no border radius, no shadow */}
      <div className="block sm:hidden">
        {members.map((m) => (
          <div
            key={m.id}
            className="bg-white border-b border-gray-200 p-3 m-0 rounded-none shadow-none"
            style={{ margin: 0, borderRadius: 0, boxShadow: "none" }}
          >
            <div className="font-semibold text-base mb-1">{m.name}</div>
            <div className="text-xs text-gray-500 mb-2">
              Flat: <span className="font-medium text-gray-700">{m.flat}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Phone: <span className="font-medium text-gray-700">{m.phone}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <Tag color="blue">{m.role}</Tag>
              <Tag color={m.status === "Active" ? "green" : "red"}>{m.status}</Tag>
            </div>
            {isAdmin && (
              <div className="flex gap-2 mt-2">
                <Button size="small" onClick={() => openEditModal(m)}>
                  Edit
                </Button>
                <Button size="small" danger onClick={() => handleDelete(m)}>
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        title={editingMember ? "Edit Member" : "Add Member"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        okText={editingMember ? "Update" : "Add"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Member Name"
            name="name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Flat No"
            name="flat"
            rules={[{ required: true, message: "Please enter flat number" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Role" name="role" rules={[{ required: true }]}>
            <Select options={roles.map((r) => ({ value: r }))} />
          </Form.Item>

          <Form.Item label="Status" name="status" initialValue="Active">
            <Select options={[{ value: "Active" }, { value: "Inactive" }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

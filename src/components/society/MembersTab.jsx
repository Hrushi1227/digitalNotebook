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

      <Table columns={columns} dataSource={members} rowKey="id" />

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

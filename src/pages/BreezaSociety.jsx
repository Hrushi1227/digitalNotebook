import {
  CarOutlined,
  FileTextOutlined,
  NotificationOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Card, Tabs } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import MembersTab from "../components/society/MembersTab";
import NoticesTab from "../components/society/NoticesTab";
import ParkingTab from "../components/society/ParkingTab";
import VendorsTab from "../components/society/VendorsTab";
import { logout } from "../store/authSlice";

const items = [
  {
    key: "members",
    label: "Members",
    icon: <TeamOutlined />,
    children: <MembersTab />,
  },
  {
    key: "parking",
    label: "Parking",
    icon: <CarOutlined />,
    children: <ParkingTab />,
  },
  {
    key: "rules",
    label: "Rules & Documents",
    icon: <FileTextOutlined />,
    children: (
      <Card title="Society Rules & Documents">
        Add society rules, upload bye-laws, meeting PDFs and notices.
      </Card>
    ),
  },
  // Removed Maintenance & Finance and Complaints tabs as per request
  {
    key: "notices",
    label: "Notices",
    icon: <NotificationOutlined />,
    children: <NoticesTab />,
  },
  {
    key: "vendors",
    label: "Vendors & Staff",
    icon: <UserOutlined />,
    children: <VendorsTab />,
  },
];

export default function BreezaSociety() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">
          Breeza Society – Chairman Admin Panel
        </h1>
        <Button danger onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <Tabs
        items={items}
        tabPosition="top"
        size="large"
        destroyInactiveTabPane
      />
    </div>
  );
}

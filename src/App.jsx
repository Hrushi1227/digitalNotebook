import {
  BarChartOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Budgets from "./pages/Budgets";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Ledger from "./pages/Ledger";
import Login from "./pages/Login";
import Materials from "./pages/Materials";
import Messages from "./pages/Messages";
import Payments from "./pages/Payments";
import PaymentSchedule from "./pages/PaymentSchedule";
import Tasks from "./pages/Tasks";
import WorkerDetails from "./pages/WorkerDetails";
import WorkerLogin from "./pages/WorkerLogin";
import WorkerPortal from "./pages/WorkerPortal";
import Workers from "./pages/Workers";
import WorkProgress from "./pages/WorkProgress";
import {
  logout,
  selectIsAuthenticated,
  selectUserRole,
} from "./store/authSlice";
import { initializeSession } from "./utils/security";

const { Header, Sider, Content, Footer } = Layout;

const items = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: <Link to="/">Dashboard</Link>,
  },
  {
    key: "/workers",
    icon: <TeamOutlined />,
    label: <Link to="/workers">Workers</Link>,
  },
  {
    key: "/tasks",
    icon: <CheckSquareOutlined />,
    label: <Link to="/tasks">Tasks</Link>,
  },
  {
    key: "/materials",
    icon: <ShoppingCartOutlined />,
    label: <Link to="/materials">Materials</Link>,
  },
  {
    key: "/payments",
    icon: <WalletOutlined />,
    label: <Link to="/payments">Payments</Link>,
  },
  {
    key: "/budgets",
    icon: <WalletOutlined />,
    label: <Link to="/budgets">Budgets</Link>,
  },
  {
    key: "/invoices",
    icon: <ShoppingCartOutlined />,
    label: <Link to="/invoices">Invoices</Link>,
  },
  {
    key: "/ledger",
    icon: <DashboardOutlined />,
    label: <Link to="/ledger">Ledger</Link>,
  },
  {
    key: "/schedule",
    icon: <CheckSquareOutlined />,
    label: <Link to="/schedule">Payment Schedule</Link>,
  },
  {
    key: "/progress",
    icon: <BarChartOutlined />,
    label: <Link to="/progress">Work Progress</Link>,
  },
  {
    key: "/messages",
    icon: <MessageOutlined />,
    label: <Link to="/messages">Messages</Link>,
  },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    initializeSession();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // Show login screen
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/worker-login" element={<WorkerLogin />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // Show worker portal
  if (userRole === "worker") {
    return <WorkerPortal />;
  }

  // Show admin dashboard

  return (
    <Layout className="min-h-screen">
      {/* Sidebar */}
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        width={220}
        collapsible
        collapsed={collapsed}
        onCollapse={(val) => setCollapsed(val)}
        trigger={null}
      >
        <div className="text-white text-lg font-semibold px-4 py-3">
          Renovation
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={() => {
            try {
              if (typeof window !== "undefined" && window.innerWidth < 992) {
                setCollapsed(true);
              }
            } catch (e) {
              // ignore
            }
          }}
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="lg:hidden mr-3">
              <Button
                type="text"
                onClick={() => setCollapsed(!collapsed)}
                icon={<MenuOutlined />}
              />
            </div>
            <div className="text-xl font-semibold">Home Renovation Tracker</div>
          </div>
          <Button
            type="text"
            danger
            onClick={handleLogout}
            icon={<LogoutOutlined />}
          >
            Logout
          </Button>
        </Header>

        {/* Page Content */}
        <Content className="p-6 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workers" element={<Workers />} />
              <Route path="/workers/:id" element={<WorkerDetails />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/schedule" element={<PaymentSchedule />} />
              <Route path="/progress" element={<WorkProgress />} />
              <Route path="/messages" element={<Messages />} />
            </Routes>
          </div>
        </Content>

        {/* Footer */}
        <Footer className="text-center text-slate-400">
          © {new Date().getFullYear()} Breeza
        </Footer>
      </Layout>
    </Layout>
  );
}

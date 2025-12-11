import {
  CheckSquareOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Layout, Menu } from "antd";
import { Link, Route, Routes, useLocation } from "react-router-dom";

import Budgets from "./pages/Budgets";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Ledger from "./pages/Ledger";
import Materials from "./pages/Materials";
import Payments from "./pages/Payments";
import PaymentSchedule from "./pages/PaymentSchedule";
import Tasks from "./pages/Tasks";
import WorkerDetails from "./pages/WorkerDetails";
import Workers from "./pages/Workers";

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
];

export default function App() {
  const location = useLocation();

  return (
    <Layout className="min-h-screen">
      {/* Sidebar */}
      <Sider breakpoint="lg" collapsedWidth={0} width={220}>
        <div className="text-white text-lg font-semibold px-4 py-3">
          Renovation
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        <Header className="bg-white shadow-sm px-6 flex items-center">
          <div className="text-xl font-semibold">Home Renovation Tracker</div>
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

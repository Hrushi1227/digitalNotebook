import { Button, Card, Form, Input, message } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../store/authSlice";
import { selectMembers } from "../store/membersSlice";
import { selectWorkers } from "../store/workersSlice";

export default function UniversalLogin() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const workers = useSelector(selectWorkers);
  const members = useSelector(selectMembers);

  const handleLogin = (vals) => {
    const phone = vals.phone?.trim();
    if (!phone) {
      message.error("Please enter your mobile number");
      return;
    }
    if (!/^\d+$/.test(phone)) {
      message.error("Mobile number must contain digits only");
      return;
    }
    if (phone.length !== 10) {
      message.error("Mobile number must be exactly 10 digits");
      return;
    }
    setLoading(true);
    // Check workers
    const worker = workers.find((w) => w.phone === phone);
    if (worker) {
      dispatch(login({ role: "worker", workerId: phone }));
      message.success("Welcome, Worker!");
      navigate("/worker-portal");
      setLoading(false);
      return;
    }
    // Check members
    const member = members.find((m) => m.phone === phone);
    if (member) {
      dispatch(login({ role: "member", workerId: phone }));
      message.success("Welcome, Society Member!");
      navigate("/society");
      setLoading(false);
      return;
    }
    message.error("Mobile number not found. Please contact admin.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl backdrop-blur-xl bg-white/80 border border-white/40 p-4 sm:p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            Breeza Portal Login
          </h1>
          <p className="text-gray-500 mt-1 tracking-wide">
            Enter your mobile number to continue
          </p>
        </div>
        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="phone"
            label={
              <span className="font-medium text-gray-700">Mobile Number</span>
            }
            rules={[{ required: true, message: "Enter your mobile number" }]}
          >
            <Input
              placeholder="Enter your 10-digit phone number"
              size="large"
              maxLength={10}
              className="rounded-xl"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
        <div className="text-center text-sm text-gray-600 mt-6">
          <p className="mb-2">Are you an admin?</p>
          <Button
            type="link"
            className="text-base text-blue-600"
            onClick={() => navigate("/admin-login")}
          >
            Login as Admin
          </Button>
        </div>
      </Card>
    </div>
  );
}

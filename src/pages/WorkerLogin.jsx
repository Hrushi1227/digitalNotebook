import { Button, Card, Form, Input, message } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../store/authSlice";

export default function WorkerLogin() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = (vals) => {
    const phone = vals.phone?.trim();

    // ❌ Block empty
    if (!phone) {
      message.error("Please enter your mobile number");
      return;
    }

    // ❌ Allow digits ONLY
    if (!/^\d+$/.test(phone)) {
      message.error("Mobile number must contain digits only");
      return;
    }

    // ❌ Enforce 10-digit number (India style)
    if (phone.length !== 10) {
      message.error("Mobile number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    try {
      // Save worker role + phone number
      dispatch(login({ role: "worker", workerId: phone }));

      message.success("Login successful");
      navigate("/worker-portal");
    } catch {
      message.error("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl backdrop-blur-xl bg-white/80 border border-white/40 p-4 sm:p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            Renovation Tracker
          </h1>
          <p className="text-gray-500 mt-1 tracking-wide">
            Worker Access (Mobile Number Only)
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
              Login as Worker
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

import { Button, Card, Form, Input, message } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PASSCODE } from "../config";
import { login } from "../store/authSlice";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = (vals) => {
    setLoading(true);
    if (vals.passcode === PASSCODE) {
      dispatch(login({ role: "admin" }));
      message.success("Welcome Admin!");
      navigate("/");
    } else {
      message.error("Invalid passcode");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-200 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl backdrop-blur-xl bg-white/80 border border-white/40 p-4 sm:p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            Renovation Tracker
          </h1>
          <p className="text-gray-500 mt-1 tracking-wide">Admin Access Only</p>
        </div>

        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="passcode"
            label={
              <span className="font-medium text-gray-700">Admin Passcode</span>
            }
            rules={[
              { required: true, message: "Enter passcode" },
              { pattern: /^\d{4,6}$/, message: "Passcode must be 4–6 digits" },
            ]}
          >
            <Input.Password
              placeholder="Enter admin passcode"
              size="large"
              className="rounded-xl"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              Login as Admin
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-600 mt-6">
          <p className="mb-2">Are you a worker?</p>
          <Button
            type="link"
            className="text-base text-indigo-600"
            onClick={() => navigate("/")}
          >
            Login as Worker
          </Button>
        </div>
      </Card>
    </div>
  );
}

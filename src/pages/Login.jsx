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

  const handleLogin = async (vals) => {
    setLoading(true);
    try {
      if (vals.passcode === PASSCODE) {
        dispatch(login({ role: "admin" }));
        message.success("Login successful!");
        navigate("/");
      } else {
        message.error("Invalid passcode");
      }
    } catch (e) {
      message.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Renovation Tracker
          </h1>
          <p className="text-gray-600">Admin Access Only</p>
        </div>

        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="passcode"
            label="Admin Passcode"
            rules={[
              { required: true, message: "Please enter passcode" },
              {
                pattern: /^\d{4,6}$/,
                message: "Passcode must be 4-6 digits",
              },
            ]}
          >
            <Input.Password
              placeholder="Enter your admin passcode"
              size="large"
              autoFocus
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Login as Admin
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Only admin can edit and delete data.</p>
          <p className="mb-4">Viewers can see data only.</p>
          <Button
            type="link"
            onClick={() => navigate("/worker-login")}
            className="text-base"
          >
            Are you a worker? Login here
          </Button>
        </div>
      </Card>
    </div>
  );
}

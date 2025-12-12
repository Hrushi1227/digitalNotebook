import { Button, Card, Form, Input, message } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../store/authSlice";

export default function WorkerLogin() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (vals) => {
    setLoading(true);
    try {
      if (vals.workerId && vals.workerId.length >= 3) {
        dispatch(login({ role: "worker", workerId: vals.workerId }));
        message.success(`Welcome, ${vals.workerId}!`);
        navigate("/worker-portal");
      } else {
        message.error("Please enter a valid worker ID");
      }
    } catch (e) {
      message.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Renovation Tracker
          </h1>
          <p className="text-gray-600">Worker Portal</p>
        </div>

        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="workerId"
            label="Worker ID / Name"
            rules={[
              { required: true, message: "Please enter your worker ID" },
              {
                min: 3,
                message: "Worker ID must be at least 3 characters",
              },
            ]}
          >
            <Input
              placeholder="Your name or ID (given by owner)"
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
              Login as Worker
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>View your payments, tasks, and message the owner.</p>
          <Button
            type="text"
            size="small"
            className="mt-2"
            onClick={() => navigate("/")}
          >
            Back to Admin Login
          </Button>
        </div>
      </Card>
    </div>
  );
}

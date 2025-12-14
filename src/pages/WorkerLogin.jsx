import { Button, Card, Form, Input, message } from "antd";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../store/authSlice";
import { selectWorkers } from "../store/workersSlice";

export default function WorkerLogin() {
  const [loading, setLoading] = useState(false);
  const workers = useSelector(selectWorkers); // 🔥 load workers from store
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (vals) => {
    const mobile = vals.workerMobile?.trim();

    setLoading(true);
    try {
      // 1️⃣ Validate number format (10 digits)
      if (!/^\d{10}$/.test(mobile)) {
        message.error("Please enter a valid 10-digit mobile number");
        setLoading(false);
        return;
      }

      // 2️⃣ Check if mobile exists in Firestore workers list
      const matchedWorker = workers.find(
        (w) => String(w.phone).trim() === mobile
      );

      if (!matchedWorker) {
        message.error("Mobile number is not registered as a worker");
        setLoading(false);
        return;
      }

      // 3️⃣ Success → login
      dispatch(login({ role: "worker", workerId: matchedWorker.id }));

      message.success(`Welcome, ${matchedWorker.name}!`);
      navigate("/worker-portal");
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
            name="workerMobile"
            label="Mobile Number"
            rules={[
              { required: true, message: "Please enter your mobile number" },
              {
                pattern: /^\d{10}$/,
                message: "Enter a valid 10-digit mobile number",
              },
            ]}
          >
            <Input
              placeholder="Enter your 10-digit mobile number"
              size="large"
              maxLength={10}
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

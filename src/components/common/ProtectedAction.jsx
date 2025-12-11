import { Checkbox, Input, Modal, Space, message } from "antd";
import { useState } from "react";
import { PASSCODE, PASSCODE_SESSION_KEY } from "../../config";

export default function ProtectedAction({
  children,
  buttonProps,
  onAuthorized,
  title = "Enter passcode",
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [remember, setRemember] = useState(true);

  const already = sessionStorage.getItem(PASSCODE_SESSION_KEY) === "1";

  const handleClick = () => {
    if (already) {
      onAuthorized();
      return;
    }
    setValue("");
    setOpen(true);
  };

  const handleOk = () => {
    if (value === PASSCODE) {
      if (remember) sessionStorage.setItem(PASSCODE_SESSION_KEY, "1");
      setOpen(false);
      onAuthorized();
    } else {
      message.error("Incorrect passcode");
    }
  };

  return (
    <>
      <span onClick={handleClick}>{children}</span>

      <Modal
        open={open}
        title={title}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        okText="Verify"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.Password
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter passcode"
            autoFocus
          />
          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          >
            Remember for this session
          </Checkbox>
        </Space>
      </Modal>
    </>
  );
}

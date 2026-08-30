import { message } from "antd";
import { auth } from "../../firebase";

export default function ProtectedAction({
  children,
  buttonProps,
  onAuthorized,
}) {
  const handleClick = () => {
    if (auth.currentUser) {
      onAuthorized();
      return;
    }
    message.error("Secure administrator sign-in required");
  };

  return (
    <span onClick={handleClick}>{children}</span>
  );
}

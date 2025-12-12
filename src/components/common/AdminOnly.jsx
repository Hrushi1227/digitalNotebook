import { Button, Popconfirm, Space } from "antd";
import { useSelector } from "react-redux";
import { selectIsAdmin } from "../../store/authSlice";

/**
 * AdminOnly component - only shows edit/delete buttons if user is admin
 * Viewers see nothing
 */
export default function AdminOnly({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
}) {
  const isAdmin = useSelector(selectIsAdmin);

  if (!isAdmin) {
    return null; // Don't show anything for non-admins
  }

  return (
    <Space>
      {onEdit && (
        <Button size="small" onClick={onEdit}>
          {editLabel}
        </Button>
      )}
      {onDelete && (
        <Popconfirm
          title="Confirm delete?"
          onConfirm={onDelete}
          okText="Delete"
          cancelText="Cancel"
        >
          <Button size="small" danger>
            {deleteLabel}
          </Button>
        </Popconfirm>
      )}
    </Space>
  );
}

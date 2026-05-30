import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../features/chat/chatSlice";

export default function Sidebar() {
  const dispatch = useDispatch();
  const onlineUsers = useSelector(
    (state) => state.chat.onlineUsers
  );

  return (
    <div style={{ width: "300px", background: "#111" }}>
      <h3 style={{ color: "white" }}>Online Users</h3>

      {onlineUsers.map((user) => (
        <div
          key={user._id}
          onClick={() => dispatch(setSelectedUser(user))}
          style={{
            padding: "10px",
            color: "white",
            cursor: "pointer",
            borderBottom: "1px solid #333",
          }}
        >
          {user.username}
        </div>
      ))}
    </div>
  );
}
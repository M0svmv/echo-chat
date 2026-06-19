import MessagesList from "./parentComponents/messagesList/MessageList";
import MessageInput from "./MessageInput";
import {useSelector,useDispatch} from "react-redux";
import {useEffect} from "react";
import { openMenu} from "../features/ui/uiSlice";
import "../styles/chatWindow.css";
export default function ChatWindow() {
  const dispatch = useDispatch();
  const active = useSelector((state) => state.chat.activeConversation);

  useEffect(() => {
    dispatch(openMenu());
  }, [active, dispatch]);

  return (
    <div className={active? "chatWindow active-chat":"chatWindow"} >
      <MessagesList />
      <MessageInput />
    </div>
  );
}
import socket from "./socket";
import store from "../app/store";
import { addMessage, setOnlineUsers, updateEditedMessage, updateMessageReactions } from "../features/chat/chatSlice";

// receive message
socket.on("getMessage", (msg) => {
  store.dispatch(addMessage(msg));
});

// online users
socket.on("onlineUsers", (users) => {
  store.dispatch(setOnlineUsers(users));
});

// edited message
socket.on("messageEdited", (message) => {
  store.dispatch(updateEditedMessage(message));
});

// toggle reaction
socket.on("messageReactionUpdated", (message) => {
  store.dispatch(updateMessageReactions(message));
});
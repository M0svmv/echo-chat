import { forwardRef } from "react";
import MessageBubble from "./MessageBubble";
import { formatDividerDate } from "../../../utils/chatDateUtils";

/**
 * يعرض كل رسايل المحادثة، مع فاصل تاريخ يظهر تلقائياً كل ما يتغير
 * يوم الرسالة عن اللي قبلها.
 */
const MessagesContainer = forwardRef(function MessagesContainer(
  {
    messages,
    currentUser,
    isGroup,
    searchQuery,
    matchingMessages,
    currentMatchIndex,
    activeReactionMenu,
    onToggleReactionMenu,
    onEmojiReact,
    onReply,
    onEdit,
    onDelete,
    onMediaClick,
  },
  ref,
) {
  return (
    <div className="messages-container" ref={ref}>
      {messages.map((msg, index) => {
        const isMine = msg.sender?._id === currentUser?._id;
        const hasMedia = msg.fileUrl && msg.fileType !== "text";
        const showText = msg.text && !(hasMedia && !msg.text);

        const isCurrentSearchedMatch =
          searchQuery && matchingMessages[currentMatchIndex]?._id === msg._id;
        const currentMsgDate = new Date(msg.createdAt).toDateString();
        const prevMsgDate =
          index > 0
            ? new Date(messages[index - 1].createdAt).toDateString()
            : null;
        const showDateDivider = currentMsgDate !== prevMsgDate;

        return (
          <div key={msg._id} style={{ display: "contents" }}>
            {showDateDivider && (
              <div className="chat-date-divider">
                <div className="date-divider-line"></div>
                <span className="date-divider-text">
                  {formatDividerDate(msg.createdAt)}
                </span>
                <div className="date-divider-line"></div>
              </div>
            )}

            <MessageBubble
              msg={msg}
              isMine={isMine}
              isGroup={isGroup}
              hasMedia={hasMedia}
              showText={showText}
              isCurrentSearchedMatch={isCurrentSearchedMatch}
              activeReactionMenu={activeReactionMenu}
              onToggleReactionMenu={onToggleReactionMenu}
              onEmojiReact={onEmojiReact}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onMediaClick={() => onMediaClick(msg)}
            />
          </div>
        );
      })}
    </div>
  );
});

export default MessagesContainer;
/**
 * يحول تاريخ الرسالة لنص مناسب للعرض في فاصل التاريخ بين الرسايل
 * (مثلاً "Today" أو "Yesterday" أو تاريخ كامل)
 */
export function formatDividerDate(dateString) {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return "Today";
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return messageDate.toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
}
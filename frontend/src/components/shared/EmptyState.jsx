/**
 * حالة "لا توجد نتائج" مشتركة بين كل قوايم السايد بار.
 */
export default function EmptyState({ message = "No results found" }) {
  return <div className="no-results">{message}</div>;
}
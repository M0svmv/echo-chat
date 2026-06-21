/**
 * أفاتار المستخدم في زرار المنيو بالنافبار: صورة لو موجودة،
 * أو الحروف الأولى من الاسم الأول والأخير.
 */
export default function UserAvatar({ avatar, firstName, lastName }) {
  return (
    <div className={avatar ? "user-icon avatar-bg" : "user-icon"}>
      {avatar ? (
        <img src={avatar} alt="Avatar" />
      ) : (
        <>
          {firstName?.charAt(0).toUpperCase()}
          {lastName?.charAt(0).toUpperCase()}
        </>
      )}
    </div>
  );
}
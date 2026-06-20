import { memo } from "react";
import { FaUsers } from "react-icons/fa";

/**
 * مكون أفاتار عام مستخدم في كل قوايم السايد بار (محادثات، جروبات،
 * أصدقاء، طلبات صداقة، أرشيف...).
 *
 * - لو فيه صورة: يعرضها
 * - لو مفيش صورة وفيه isGroup: يعرض أول حرف من اسم الجروب أو أيقونة جروب
 * - لو مفيش صورة ومستخدم عادي: يعرض أول حرف من الاسم الأول والأخير
 */
const Avatar = memo(
  ({ image, firstName, lastName, isGroup = false, size = "normal" }) => {
    const hasImage = !!image;
    const sizeClass = size === "large" ? " large" : "";

    return (
      <div className={hasImage ? "chatAvatar avatar-bg" : "chatAvatar"}>
        {!hasImage ? (
          <div className={`avatarPlaceholder${sizeClass}`}>
            {isGroup ? (
              firstName ? (
                firstName.charAt(0).toUpperCase()
              ) : (
                <FaUsers size={16} />
              )
            ) : (
              <>
                {firstName?.charAt(0).toUpperCase()}
                {lastName?.charAt(0).toUpperCase()}
              </>
            )}
          </div>
        ) : (
          <img
            src={image}
            alt={isGroup ? firstName : `${firstName} ${lastName}`}
            className="avatar"
            loading="lazy"
          />
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

export default Avatar;
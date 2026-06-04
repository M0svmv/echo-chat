const User = require("../../models/user.model");

const authService = require("./auth.service");

const tokens = require("../../utils/jwt.utils");

const status = require("../../constants/httpStatus.constants");
const messages = require("../../constants/messages.constants");

exports.register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    res
      .status(status.CREATED)
      .json({ message: messages.REGISTRATION_SUCCESS, data: user });
  } catch (error) {
    res
      .status(status.BAD_REQUEST)
      .json({ message: messages.REGISTRATION_FAILED, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await authService.loginUser(username, password);

    const accessToken = tokens.generateAccessToken(user);
    const refreshToken = tokens.generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res
      .status(status.OK)
      .json({
        message: messages.LOGIN_SUCCESS,
        user: {
          _id: user._id,
          firstName: user.firstName,
          username: user.username,
          lastName: user.lastName,
          avatar: user.avatar,
          email: user.email,
          role: user.role,
        },
        accessToken,
      });
  } catch (error) {
    res
      .status(status.UNAUTHORIZED)
      .json({ message: messages.INVALID_CREDENTIALS, error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  let refreshToken = req.cookies.refreshToken;
  console.log("Received refresh token:", refreshToken);
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const user = await authService.getRefreshToken(refreshToken);

    res.cookie("refreshToken", user.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res
        .status(status.BAD_REQUEST)
        .json({ message: messages.INVALID_TOKEN });
    }
    if (refreshToken) {
      const decoded = tokens.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded._id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      } else {
        return res
          .status(status.NOT_FOUND)
          .json({ message: messages.USER_NOT_FOUND });
      }
      res.clearCookie("refreshToken");
      res.status(status.OK).json({ message: messages.LOGOUT_SUCCESS });
    }
  } catch (error) {
    res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: messages.INTERNAL_ERROR, error: error.message });
  }
};


exports.updateProfile = async (req,res) =>{
  try {
    const userId = req.user._id;
    const { firstName, lastName, username, email, bio } = req.body;

    // 1. بناء أوبجكت التعديل بالبيانات النصية القادمة
    let updateData = { firstName, lastName, username, email,bio };

    // 2. التحقق من فريدية الـ username والـ email لو تم تغييرهم
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId }, // ابحث في كل المستخدمين ما عدا اليوزر الحالي
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.username === username 
            ? "Username is already taken" 
            : "Email is already registered" 
        });
      }
    }

    // 3. لو المستخدم رفع صورة جديدة، بنضيف لينك Cloudinary لأوبجكت التعديل
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    // 4. تحديث البيانات في الداتابيز
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true } // runValidators عشان يتأكد من شروط السكيما
    ).select("-password"); // مستحيل نرجع الباسورد للفرونت إند بالطبع

    // 5. الـ Response الراجع ده هو اللي Redux هيستقبله كـ Payload
    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
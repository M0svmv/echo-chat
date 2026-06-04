const User = require('../../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken
} = require("../../utils/jwt.utils.js");
const { hashPassword, comparePassword } = require("../../utils/password.utils.js");

const registerUser = async (userData) => {
  const { firstName, lastName, username, email, password } = userData;
  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
  });
  return user;
};

const loginUser = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error("User not found");
  }
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }
  return user;
};

const getRefreshToken = async (refreshToken) => {

    
  
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log("Decoded refresh token:", decoded);
    const user = await User.findById(decoded._id);
    console.log("user ---> ", user);
    if (!user) {
        throw new Error('User not found');
    }
    const accessToken = generateAccessToken({ _id: user._id,firstName: user.firstName, lastName: user.lastName,email: user.email,avatar: user.avatar, role: user.role });
    const newRefreshToken = generateRefreshToken({ _id: user._id,firstName: user.firstName, lastName: user.lastName,email: user.email,avatar: user.avatar, role: user.role });

    user.refreshToken = newRefreshToken;
    await user.save();
    return {
        user:{ _id: user._id,firstName: user.firstName,username: user.username, lastName: user.lastName,email: user.email,avatar: user.avatar, role: user.role },
        accessToken,
        refreshToken: newRefreshToken
    };
};


module.exports = { registerUser, loginUser, getRefreshToken };

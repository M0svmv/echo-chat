const jwt = require('jsonwebtoken');

exports.generateAccessToken = (user) => {
    return jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

exports.generateRefreshToken = (user) => {
    return jwt.sign({ _id: user._id,username: user.username, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

exports.verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

exports.verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
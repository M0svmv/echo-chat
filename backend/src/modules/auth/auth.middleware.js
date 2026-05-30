const {verifyAccessToken} = require("../../utils/jwt.utils");

const status = require("../../constants/httpStatus.constants");
const messages = require("../../constants/messages.constants");

exports.protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log("Auth Header:", authHeader); // Debugging line

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(status.UNAUTHORIZED).json({ message: messages.UNAUTHORIZED });
    }
    

    const token = authHeader.split(' ')[1];

    console.log("Extracted Token:", token); // Debugging line

    try {
        const decoded = verifyAccessToken(token);
        console.log("Decoded Access Token:", decoded); // Debugging line
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(status.UNAUTHORIZED).json({ message: messages.INVALID_TOKEN });
    }
};


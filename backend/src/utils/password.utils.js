const bcrypt = require('bcrypt');

exports.hashPassword = async (password) => {
    const salt= await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

exports.comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}

exports.validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    return regex.test(password);
}

exports.validateMatchPassword = (password, confirmPassword) => {
    return password === confirmPassword;
}
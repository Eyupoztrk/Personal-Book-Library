const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcrypt');
const Enum = require("../../config/Enum");
const CustomError = require("../../lib/Error");


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
},
    {
        versionKey: false,
        timestamps: true
    });

class UserModel extends mongoose.Model {


    validPassword(password) {
        return bcrypt.compareSync(password, this.password);
    }

    static hashPassword(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    }

    static async checkUserBeforeRegister(email, username) {

        let checkEmail = await this.findOne({ email });
        let checkUsername = await this.findOne({ username });

        if (checkEmail)
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, Enum.RESPONSE_MESSAGES.BAD_REQUEST, "Email is already used");
        if (checkUsername)
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, Enum.RESPONSE_MESSAGES.BAD_REQUEST, "Username is already used");

        return null;
    }

    static checkBody(body) {
        if (!body.email)
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, Enum.RESPONSE_MESSAGES.BAD_REQUEST, "Email field is required");
        if (!validator.isEmail(body.email))
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, Enum.RESPONSE_MESSAGES.BAD_REQUEST, "Email format is not valid");
        if (!body.password)
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, Enum.RESPONSE_MESSAGES.BAD_REQUEST, "Password field is required");

        if (typeof body.password !== "string" || body.password.length < 7)
            throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error", "email or password wrong");

        return null;
    }

   


}

userSchema.loadClass(UserModel);
module.exports = mongoose.model("users", userSchema); 
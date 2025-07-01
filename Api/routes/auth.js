var express = require('express');
var router = express.Router();
const auth = require("../lib/auth")();
const JWT = require("jwt-simple");
const UserModel = require('../database/Models/UserModel');

const Response = require("../lib/Response");
const Enum = require("../config/Enum");
const CustomError = require("../lib/Error");
const config = require("../config");






router.post("/register", async (req, res) => {
    try {
        var body = req.body;

        UserModel.checkBody(body);
        await UserModel.checkUserBeforeRegister(body.email, body.username);

        let password = UserModel.hashPassword(body.password);

        let user = await new UserModel({
            username: body.username,
            email: body.email,
            password: password,
        });

        await user.save();
        res.json(Response.successResponse(user, Enum.HTTP_CODES.ACCEPTED));
    }
    catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
    }
});



router.post("/login", async (req, res) => {
    try {
        UserModel.checkBody(req.body);

        var { email, password } = req.body;
        let user = await UserModel.findOne({ email });

        if (!user)
            throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "validation", "Email or Password wrong");

        if (!user.validPassword(password))
            throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "validation", "Email or Password wrong");

        let payload = {
            id: user._id,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        }

        let token = JWT.encode(payload, config.JWT.SECRET);

        let userData = {
            id: user._id,
            email: user.email
        }

        res.json(Response.successResponse({ token, user: userData }));
    }
    catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
    }
});

router.all('*', auth.authenticate(), (req, res, next) => {
  next(); 
});

router.get("/me", async (req,res) =>{
    try {
       var userId = req.user.id;

       var user = await UserModel.findById(userId);

       
        res.json(Response.successResponse(user, Enum.HTTP_CODES.ACCEPTED));
    }
    catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
    }
});


module.exports = router;
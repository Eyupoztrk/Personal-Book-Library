var express = require('express');
var router = express.Router();
const auth = require("../lib/auth")();
const JWT = require("jwt-simple");
const UserModel = require('../database/Models/UserModel');

const Response = require("../lib/Response");
const Enum = require("../config/Enum");
const CustomError = require("../lib/Error");
const config = require("../config");

const {rateLimit} = require("express-rate-limit");
const rateLimitMongo = require("rate-limit-mongo")

const limiter = rateLimit({
  store: new rateLimitMongo({
    uri: config.CONNECTION_STRING,
    collectionName: "rateLimits",
    expireTimeMs: 15 * 60 * 1000
  }),
	windowMs: 15 * 60 * 1000, 
	limit: 10, 
	legacyHeaders: false,
	
});



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



router.post("/login",limiter, async (req, res) => {
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

router.get("/me", async (req, res) => {
    try {
        var userId = req.user.id;

        var user = await UserModel.findById(userId);


        res.json(Response.successResponse(user, Enum.HTTP_CODES.ACCEPTED));
    }
    catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
    }
});

router.post("/update", async (req, res) => {

    try {
        let body = req.body;
        let updates = {};

        if (!body._id)
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, Enum.RESPONSE_MESSAGES.BAD_REQUEST, "Id field is required");
        if (body.password)
            updates.password = UserModel.hashPassword(body.password);

        if (body.username) updates.username = body.username;
        if (body.email) updates.email = body.email;


        await UserModel.updateOne({ _id: body._id }, { $set: updates });
        res.json(Response.successResponse(Enum.RESPONSE_MESSAGES.UPDATED));

    } catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
    }
});


module.exports = router;
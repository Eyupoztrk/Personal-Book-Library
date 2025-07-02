var express = require('express');
var router = express.Router();
const auth = require("../lib/auth")();
const CategoryModel = require("../database/Models/CategoryModel");

const Response = require("../lib/Response");
const Enum = require("../config/Enum");
const CustomError = require("../lib/Error");



router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

router.get("/", async (req, res) => {
    try {
        let categories = await CategoryModel.find({});
        res.json(Response.successResponse(categories, Enum.HTTP_CODES.ACCEPTED));
    }
    catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let category = await CategoryModel.findById(id);

        if (!category) {
            return res.json(Response.errorResponse("Category not found", Enum.HTTP_CODES.NOT_FOUND));
        }

        res.json(Response.successResponse(category, Enum.HTTP_CODES.ACCEPTED));
    } catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST));
    }
});

router.post("/add", async (req, res) => {
    try {
        let body = req.body;

        if (!body.name)
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, Enum.RESPONSE_MESSAGES.BAD_REQUEST, "Project field is required");


        let category = new CategoryModel({
            name: body.name,
            user: req.user?.id
        });

        await category.save();
        res.json(Response.successResponse(Enum.RESPONSE_MESSAGES.CREATED));

    }
    catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))

    }

});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user.id;

        if (!name) {
            throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "bad request", "Name field is required");
        }

        const updatedCategory = await CategoryModel.findOneAndUpdate(
            { _id: id, user: userId },
            { name: name },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
        }

        res.json(Response.successResponse(Enum.RESPONSE_MESSAGES.UPDATED));

    } catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))

    }
});





module.exports = router;
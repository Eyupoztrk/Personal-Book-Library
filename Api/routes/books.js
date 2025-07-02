var express = require('express');
var router = express.Router();
const auth = require("../lib/auth")();
const BookModel = require("../database/Models/BookModel");

const Response = require("../lib/Response");
const Enum = require("../config/Enum");
const CustomError = require("../lib/Error");


router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

router.get('/', async (req, res) => {
    try {
        const findQuery = {
            user: req.user._id
        };

        const { category, rating } = req.query;

        if (category) {
            findQuery.category = category;
        }

        if (rating) {
            findQuery.rating = rating;
        }

        const { search } = req.query;

        let books;

        if (search) {
            books = await BookModel.find({
                $and: [
                    findQuery,
                    {
                        $or: [
                            { title: { $regex: search, $options: 'i' } },
                            { author: { $regex: search, $options: 'i' } }
                        ]
                    }
                ]
            }).populate('category', 'name');

        } else {
            books = await BookModel.find(findQuery)
                .populate('category', 'name');
        }

        res.json(Response.successResponse(books, Enum.RESPONSE_MESSAGES.SUCCESS));

    } catch (err) {

        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let book = await BookModel.findById(id);

        if (!book) {
            return res.json(Response.errorResponse("Book not found", Enum.HTTP_CODES.NOT_FOUND));
        }

        res.json(Response.successResponse(book, Enum.HTTP_CODES.ACCEPTED));
    } catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST));
    }
});


router.post("/add", async (req, res) => {
    try {
        let body = req.body;

        if (!body.title)
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, Enum.RESPONSE_MESSAGES.BAD_REQUEST, "Title field is required");
        if (!body.author)
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, Enum.RESPONSE_MESSAGES.BAD_REQUEST, "Author field is required");


        let book = new BookModel({
            title: body.title,
            author: body.author,
            rating: body.rating,
            notes: body.notes,
            readDate: body.readDate,
            user: req.user?.id,
            category: body.category
        });

        await book.save();
        res.json(Response.successResponse(Enum.RESPONSE_MESSAGES.CREATED));

    }
    catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))

    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updateData = req.body;


        const updatedBook = await BookModel.findOneAndUpdate(
            { _id: id, user: userId },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedBook) {
             return res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
        }

        res.json(Response.successResponse(updatedBook, Enum.RESPONSE_MESSAGES.UPDATED));

    } catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const deletedBook = await BookModel.findOneAndDelete({ _id: id, user: userId });

        if (!deletedBook) {
             return res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
        }

        res.json(Response.successResponse(updatedBook, Enum.RESPONSE_MESSAGES.UPDATED));

    } catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST))
    }
});

module.exports = router;
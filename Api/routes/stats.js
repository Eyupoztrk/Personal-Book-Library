var express = require('express');
var router = express.Router();
const auth = require("../lib/auth")();
const mongoose = require('mongoose');
const BookModel = require("../database/Models/BookModel");
const CategoryModel = require("../database/Models/CategoryModel");

const Response = require("../lib/Response");
const Enum = require("../config/Enum");
const CustomError = require("../lib/Error");


router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

router.get("/summary", async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const statsPipeline = [
            {
                $match: { user: userId }
            },
            {
                $facet: {
                    "generalStats": [
                        {
                            $group: {
                                _id: null,
                                totalBooks: { $sum: 1 },
                                averageRating: { $avg: { $toDouble: "$rating" } }
                            }
                        }
                    ],
                    "categoryStats": [
                        { $group: { _id: "$category", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 1 },

                        {
                            $lookup: {
                                from: "categories",
                                localField: "_id",
                                foreignField: "_id",
                                as: "categoryInfo"
                            }
                        },
                        { $unwind: "$categoryInfo" }
                    ]
                }
            }
        ];

        const result = await BookModel.aggregate(statsPipeline);

        const statsData = result[0];
        const generalStats = statsData.generalStats[0] || {};
        const categoryStats = statsData.categoryStats[0] || {};

        const summary = {
            totalBooks: generalStats.totalBooks || 0,
            averageRating: generalStats.averageRating ? parseFloat(generalStats.averageRating.toFixed(2)) : 0,
            mostReadCategory: {
                name: categoryStats.categoryInfo ? categoryStats.categoryInfo.name : "Unspecified",
                count: categoryStats.count || 0
            }
        };

        res.json(Response.successResponse(summary, Enum.HTTP_CODES.ACCEPTED));

    } catch (err) {
        res.json(Response.errorResponse(err, Enum.HTTP_CODES.BAD_REQUEST));

    }
});


module.exports = router;
const mongoose = require("mongoose");


const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    rating: String,
    notes: String,
    readDate: mongoose.Schema.Types.Date,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'categories' },
},
    {
        versionKey: false,
        timestamps: true
    });

class BookModel extends mongoose.Model {

}

bookSchema.loadClass(BookModel);
module.exports = mongoose.model("books", bookSchema); 
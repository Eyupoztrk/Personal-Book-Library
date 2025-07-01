const mongoose = require("mongoose");


const categorySchema = new mongoose.Schema(
    {
    name: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    },
    
    {
        versionKey: false,
        timestamps: true
    });

class CategoryModel extends mongoose.model {

}

categorySchema.loadClass(CategoryModel);
module.exports = mongoose.model("categories", categorySchema); 
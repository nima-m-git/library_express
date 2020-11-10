var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = new Schema(
    {
        name: {type: String, required: true, minlength: 3, maxlength: 100},
    }
);

// Virtual for Genre url
GenreSchema
.virtual('url')
.get(function () {
    return '/catalog/genre/' + this.id;
});

// Export Module
module.exports = mongoose.model('Genre', GenreSchema);
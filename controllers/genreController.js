const { body, validationResult } = require('express-validator');
var Genre = require('../models/genre');
var Book = require('../models/book');

var async = require('async');


// Display list of all Genre.
exports.genre_list = function(req, res) {
    
    Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
        if (err) { return next(err); }
        res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
            .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id})
            .exec(callback);
        },


    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre == null) { //No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Success, render
        res.render('genre_detail', { genre: results.genre, genre_books: results.genre_books } );
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [
    
    // Validate and sanitise name field
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

    // Proces request after validation and sanitization
    (req, res, next) => {

        // Extract validation errors from request
        const errors = validationResult(req);

        // Create genre object with escaped and trimmed data
        var genre = new Genre(
            { name: req.body.name }
        )

        if (!errors.isEmpty()) {
            // errors exist, rerender form with santized values/error msgs
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()})
            return;
        } else {
            // Data is valid
            // check if genre name already exists
            Genre.findOne({ 'name': req.body.name })
                .exec( function(err, found_genre) {
                    if (err) { return next(err); }

                    if (found_genre) {
                        // Genre exists, redirect to its detail page
                        res.redirect(found_genre.url);
                    } else {

                        genre.save(function (err) {
                            if (err) { return next(err); }
                            // genre saved, redirect to genre detail page
                            res.redirect(genre.url);
                        });
                    }
                });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'author': req.params.id}).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) {
            res.redirect('/catalog/genres');
        }
        res.render('genre_delete', { title: 'Delete Genre', ...results })
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.body.genreid }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre_books.length > 0) {
            res.render('genre_delete', { title: 'Delete Genre', ...results, });
            return
        } else {
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err){
                if (err) { return next(err); }
                res.redirect('/catalog/genres');
            })
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genres_books: function(callback) {
            Book.find({ 'genre': req.params.id }).exec(callback);
        },
    }, function(err, results) {
            if (err) { return next(err); }
            if (results.genre==null) {
                res.redirect('/catalog/genres');
            }
            res.render('genre_form', { title: 'Genre Update', ...results, })
        }
    );
};

// Handle Genre update on POST.
exports.genre_update_post = [

    // Validate and sanitise name field
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

    // Process request after validation and sanitization
    (req, res, next) => {

        // Extract validation errors from request
        const errors = validationResult(body);

        // Create genre with escaped and trimmed data
        const genre = new Genre({
            ...req.body,
            _id: req.params.id,
        })

        if (!errors.isEmpty()) {
            // there are errors, render form again with sanitized values / errors
            async.parallel({
                genre: function(callback) {
                    Genre.findById(req.params.id).exec(callback);
                },
                genres_books: function(callback) {
                    Book.find({ 'genre': req.params.id }).exec(callback);
                },
                function(err, results) {
                    if (err) { return next(err); }
                    if (results.genre==null) {
                        res.redirect('/catalog/genres');
                    }
                    res.render('genre_form', { title: 'Genre Update', ...results, })
                }
            });
            return;
        } 
        else {
            // Form data valid
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, thegenre) {
                if (err) { return next(err); }
                res.redirect(thegenre.url);
            });
        }
    }
];
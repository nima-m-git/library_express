var async = require('async');
var Book = require('../models/book');
var Author = require('../models/author');

const { body, validationResult } = require('express-validator');

// Display list of all authors
exports.author_list = function(req, res) {

    Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
        if (err) { return next(err); }
        //Success, render
        res.render('author_list', { title: 'Author List', author_list: list_authors});
    });
}

// Display detail page for a specific author
exports.author_detail = function(req, res, next) {
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.params.id }, 'title summary')
            .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage
        if (results.author == null) { // No results
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Success, render
        res.render('author_detail', { title: 'Author Detail', ...results, } );
    });
}

// Display Author create form on GET
exports.author_create_get = function(req, res, next) {
    res.render('author_form', { title: 'New Author' });
}

// Handle author create on post
exports.author_create_post = [

    // Validate and sanitise fields
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non alphanumeric characters.'),
    body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('First name has non alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after sanitization
    (req, res, next) => {

        // Extract the validation errors from request
        const errors = validationResult(req);

        // Create author object with escaped and trimmed data
        var author = new Author(
            {
                ...req.body
            }
        );

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages
            res.render('author_form', { title: 'New Author', author: req.body, errors: errors.array() });
            return;
        } else {
            // Data from form is valid
            author.save(function (err) {
                if (err) { next(err); }
                // Success, redirect to new author record
                res.redirect(author.url);
            });
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author==null) {
            res.redirect('/catalog/authors');
        }
        res.render('author_delete', { title: 'Delete Author', ...results, })
    });
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid).exec(callback);
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.body.authorid }).exec(callback);
        },
    }, function(err, results) {
        if (err) { next(err); }
        if (results.authors_books.length > 0) {
            // Author has books, render GET
            res.render('author_delete', { title: 'Delete Author', ...results} );
            return;
        } else {
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                // successm go to author list
                res.redirect('/catalog/authors')
            })
        }
    });
};

// Display Author update form on GET.
exports.author_update_get = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback);
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author==null) {
            res.redirect('/catalog/authors');
        }
        res.render('author_form', { title: 'Author Form', ...results, });
    });
};

// Handle Author update on POST.
exports.author_update_post = [

    // Validate and sanitise fields
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non alphanumeric characters.'),
    body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('First name has non alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after sanitization
    (req, res, next) => {

        // Extract the validation errors from request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages
            res.render('author_form', { title: 'New Author', author: req.body, errors: errors.array() });
            return;
        } else {
            // Data from form is valid
            // Update author
            var author = new Author(
                {
                    ...req.body,
                    _id:req.params.id //This is required, or a new ID will be assigned!
                }
            );
            Author.findByIdAndUpdate(req.params.id, author, {}, function(err, theauthor){
                if (err) { return next(err); }
                res.redirect(theauthor.url);
            });
        }
    }
]
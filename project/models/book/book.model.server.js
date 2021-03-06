module.exports = function () {
    var mongoose = require("mongoose");
    var BookSchema = require("./book.schema.server.js")();
    var BookModel = mongoose.model("BookModel", BookSchema);

    var model = {};

    var api = {
        createBook: createBook,
        findAllBooksForBookshelf: findAllBooksForBookshelf,
        findReviewObjectIdsForBook: findReviewObjectIdsForBook,
        findBookById: findBookById,
        findBooksByBookshelfIdAndGoogleBookId: findBooksByBookshelfIdAndGoogleBookId,
        deleteBook: deleteBook,
        moveBetweenBookshelves: moveBetweenBookshelves,
        deleteAllBooks: deleteAllBooks,
        setModel: setModel
    };
    return api;

    function createBook(bookshelfId, book) {
        return BookModel
            .create(book)
            .then(
                function (newBook) {
                    return model
                        .bookshelfModel
                        .findBookshelfById(bookshelfId)
                        .then(
                            function (bookshelf) {
                                bookshelf.books.push(newBook._id);
                                newBook._bookshelf = bookshelf._id;
                                newBook.save();
                                bookshelf.save();
                                return newBook;
                            },
                            function (error) {
                            }
                        );
                },
                function () {

                });
    }

    function findAllBooksForBookshelf(bookshelfId) {
        return model
            .bookshelfModel
            .findBookObjectIdsForBookshelf(bookshelfId)
            .then(
                function (listOfBookObjectIds) {
                    return BookModel
                        .find({_id: {$in: listOfBookObjectIds}});
                },
                function (error) {
                }
            );
    }

    function findReviewObjectIdsForBook(bookId) {
        return BookModel
            .findById(bookId)
            .then(
                function (book) {
                    return book.reviews;
                }
            );
    }

    function findBookById(bookId) {
        return BookModel.findById(bookId);
    }

    function findBooksByBookshelfIdAndGoogleBookId(bookshelfId, googleBookId) {
        return BookModel.find({_bookshelf: bookshelfId, googleBookId: googleBookId});
    }

    function moveBetweenBookshelves(bookId, oldBookshelfId, toBeMovedToBookshelfId) {
        return BookModel
            .findById(bookId)
            .then(
                function (book) {
                    return model
                        .bookshelfModel
                        .findBookshelfById(oldBookshelfId)
                        .then(
                            function (oldBookshelf) {
                                return model
                                    .bookshelfModel
                                    .findBookshelfById(toBeMovedToBookshelfId)
                                    .then(
                                        function (toBeMovedToBookshelf) {
                                            const indexInOldBookshelf = oldBookshelf.books.indexOf(book._id);
                                            oldBookshelf.books.splice(indexInOldBookshelf, 1);
                                            oldBookshelf.save();
                                            toBeMovedToBookshelf.books.push(book._id);
                                            book._bookshelf = toBeMovedToBookshelf._id;
                                            book.save();
                                            toBeMovedToBookshelf.save();
                                            return true;
                                        },
                                        function (error) {
                                        }
                                    )
                            },
                            function (error) {
                            }
                        )
                },
                function (error) {
                }
            )
    }

    function deleteBook(bookId) {
        return model
            .bookModel
            .findBookById(bookId)
            .then(
                function (book) {
                    var bookshelfId = book._bookshelf;
                    return BookModel
                        .remove({_id: book._id.valueOf()})
                        .then(
                            function (response) {
                                model
                                    .bookshelfModel
                                    .findBookshelfById(bookshelfId.valueOf())
                                    .then(
                                        function (bookshelf) {
                                            const index = bookshelf.books.indexOf(book._id);
                                            bookshelf.books.splice(index, 1);
                                            return bookshelf.save();
                                        },
                                        function (error) {
                                        }
                                    );
                            },
                            function () {

                            });
                }
            );
    }

    function deleteAllBooks() {
        return BookModel.remove();
    }

    function setModel(_model) {
        model = _model;
    }
}
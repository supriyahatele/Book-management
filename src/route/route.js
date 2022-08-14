const express = require('express');
const router = express.Router();


const { createBook,getBooks,getBookById,updateBook,deleteBook} = require('../Controllers/bookController')
const { createUser,loginUser} = require('../Controllers/userController')
const {authentication}=require("../middlware/authentication")
const{createReview,updatedReviewById,deleteReview}=require('../Controllers/reviewController')

// ==========================================================================
router.post('/register',createUser)
router.post("/login",loginUser)

// ==========================================================================
router.post('/books',authentication,createBook)
router.get('/books',authentication,getBooks)
router.get('/books/:bookId',authentication,getBookById)
router.put('/books/:bookId',authentication,updateBook)
router.delete('/books/:bookId',authentication,deleteBook)

// ==========================================================================

router.post('/books/:bookId/review',createReview)
router.put('/books/:bookId/review/:reviewId',updatedReviewById)
router.delete('/books/:bookId/review/:reviewId',deleteReview)



module.exports = router

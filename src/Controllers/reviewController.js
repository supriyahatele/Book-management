const bookModel = require("../Models/bookModel");
const mongoose = require('mongoose')
const reviewModel=require("../models/reviewModel")
 
 //=====================================CREATE REVIEW=============================================//


let isValid = function (value) {
    if (typeof value === "undefined" || value === "null") return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
  };

let validRating = function (value) {
    if (value >= 1 && value <= 5) return true;
  };
let reviewedDate = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/;
let validString = /^[ a-z ]+$/i;



const createReview = async function (req, res) {
    try {
      let bookId = req.params.bookId; //writing the bookId in the params we want to fetch detail about
  
      if (!bookId)  return res.status(400).send({ status: false, message: "Book Id is required" });
      
  
      if (!mongoose.isValidObjectId(bookId) ){
        // validating bookId is a valid object Id or not
        return res.status(400).send({ status: false, message: "Please Provide a valid book Id" });
      }
      let findBook = await bookModel.findById({ _id: bookId });
  
      if (!findBook) {
        return res.status(404).send({ status: false, message: "Book Id not found" });
      }
  
      //checking wheather the book is deleted or not if it is deleted it should returnthe below response
      if (findBook.isDeleted === true) {
        return res.status(404).send({status: false,message: "Book not Found or Already been Deleted",});
      }

          //getting data from request body
      let { review, rating, reviewedBy, reviewedAt } = req.body; //Destructuring data coming from request body
  
      if (Object.keys(req.body).length == 0) 
      { return res.status(400).send({ status: false, msg: "Please enter details in the request Body " }) }
  
      //validation starts

      if(reviewedBy){
      if (!validString.test(reviewedBy)) {
        return res.status(400).send({ status: false, message: "name should be lettrs only" });
      }
    }

      if (!isValid(review)) {
        return res.status(400).send({ status: false, message: "Review is required" });
      }
  
      if (!isValid(rating)) {
        return res.status(400).send({ status: false, message: "Rating is required" });
      }
      if (!validRating(rating)) {
        return res.status(400).send({ status: false, message: "Rating must be between 1 to 5" });
      }
      if (!isValid(reviewedAt)) {
        return res.status(400).send({ status: false, message: "ReviewAt is required" });
      }
      if (!reviewedDate.test(reviewedAt)) {
        return res.status(400).send({
          status: false,
          message: "Reviewed Date should be in YYYY-MM-DD format",
        });
      }
  
      //the data that we want to show in the response body , i stored in a variable in a  Object form
      let reviewData = {
        bookId: bookId,
        reviewedBy: req.body.reviewedBy,
        reviewedAt: Date.now(),
        rating: req.body.rating,
        review: req.body.review,
      };
  
      //then i have created the review
      let bookReview = await reviewModel.create(reviewData);
  
      let updatedBook = await bookModel.findOneAndUpdate(
        { _id: bookId, isDeleted: false },
        { $inc: { reviews: 1 } },
        { new: true }
        );
    
        //the data that we want to show in the response body , i stored in a variable in a  Object form
        let reviewDetails = {
        //   _id: `ObjectId(${bookDetail._id})`,
          title: findBook.title,
          excerpt: findBook.excerpt,
          userId: findBook.userId,
          category: findBook.category,
          subcategory: findBook.subcategory,
          isDeleted: findBook.isDeleted,
          review: updatedBook.reviews,
          releasedAt: findBook.releasedAt,
          createdAt: findBook.createdAt,
          updatedAt: findBook.updatedAt,
          reviewsData: {
            _id: bookReview._id,
            bookId: bookId,
            reviewedBy: bookReview.reviewedBy,
            reviewedAt: bookReview.reviewedAt,
            rating: bookReview.rating,
            review: bookReview.review,
          },
        };
    
        return res.status(201).send({
          status: true,
          message: "Review Created Successfully",
          data: reviewDetails,
        });
      } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
      }
    };



// =========================================[update-Review-By-Id]====================================================================

const updatedReviewById = async function (req, res) {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        let bookId = req.params.bookId
        let reviewId = req.params.reviewId;
        bookId = bookId.trim()
        reviewId = reviewId.trim()
        let data= req.body
       let {reviewedBy,rating,review  } = data

        //bookId validation
        if (!bookId) return res.status(400).send({ status: false, message: "Please give book id" });
        if (!mongoose.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Book Id is Invalid !!!!" })

        //bookId exist in our database
        const findBook = await bookModel.findOne({ _id: bookId, isDeleted: false }); //check id exist in book model
        if (!findBook) return res.status(404).send({ status: false, message: "BookId dont exist" });

        //review-
        if (!reviewId) return res.status(400).send({ status: false, message: "review Id is required" });
        if (!mongoose.isValidObjectId(reviewId)) return res.status(400).send({ status: false, message: "Review Id is Invalid !!!!" })

        const findReview = await reviewModel.findOne({ _id: reviewId, bookId: bookId, isDeleted: false, }); //check id exist in review model
        if (!findReview) return res.status(404).send({ status: false, message: "reviewId dont exist or deleted" });

        const updateReview = await reviewModel.findByIdAndUpdate({ _id: reviewId, bookId: bookId, isDeleted: false }, {$set:{ reviewedBy:reviewedBy,rating:rating,review:review}}, { new: true });

        const countReview = await reviewModel.find({bookId:bookId,isDeleted:false}).count()

        let finalResult = {
            title: findBook.title, excerpt: findBook.excerpt, userId: findBook.userId, category: findBook.category, subcategory: findBook.subcategory,
            isDeleted: findBook.isDeleted, reviews:countReview , releasedAt: findBook.releasedAt, createdAt: findBook.createdAt, updatedAt: findBook.updatedAt, reviewData: updateReview
        }
        res.status(200).send({ status: true, message: 'Success', data: finalResult })       
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};


// ===========================================[delete-Review]========================================================



const deleteReview = async function (req, res) {
    try {
      let bookId = req.params.bookId; //writing the bookId in the params we want to fetch detail about
  
      //check wheather book Id is present in the params or not
      if (!bookId) {
        return res.status(400).send({ status: false, message: "book Id is required" });
      }
      if (!mongoose.isValidObjectId(bookId)) {
        // validating reviewId is a valid object Id or not
        return res.status(400).send({ status: false, message: "Please provide a valid Book Id" });
      }
      let findBooks = await bookModel.findById({ _id: bookId });
  
      if (!findBooks) {
        return res.status(404).send({ status: false, message: "Book Id not found" });
      }
  
      let reviewId = req.params.reviewId; //writing the review Id in the params we want to fetch detail about
      // reviewId=reviewId.trim()
      //check wheather review Id is present in the params or not
      if (!reviewId)
        return res.status(400).send({ status: false, message: "review Id is required" });
      if (!mongoose.isValidObjectId(reviewId)) {
        return res.status(400).send({ status: false, message: "Please provide a valid review Id" });
      }
  
      
      //find the id of the review which have isDeleted as False
     
      let findReviewId = await reviewModel.findById({ _id: reviewId });
  
      if (bookId != findReviewId.bookId) {
        //check wheather bookId in the params is same as the book Id of the review in DB
        return res.status(404).send({
          status: false,message: "Review  is not belong to that Book ",
        });
      }
  
      //checking wheather there is something in the findreview or not
  
      if (findReviewId.isDeleted===true) {
        return res.status(400).send({ status: false, message: "Already  Deleted" });
      } else {
        await reviewModel.findByIdAndUpdate(
          //updating the review with is Deleted as True
          { _id: reviewId },{ $set: { isDeleted: true, deletedAt: new Date() } },{ new: true });
      }
  
      //decreasing the review count in the bookmodel
      await bookModel.findOneAndUpdate(
        { _id: bookId, isDeleted: false },
        { $inc: { reviews: -1 } }
      );
  
      return res.status(200).send({ status: true, message: "Review is Deleted" });
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };

module.exports={createReview,updatedReviewById,deleteReview}
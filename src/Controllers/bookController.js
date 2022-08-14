const bookModel = require("../Models/bookModel");
const userModel = require("../Models/userModel");
const mongoose = require('mongoose')
 const reviewModel=require("../models/reviewModel")
 const {uploadFile} = require("../aws/aws");


// ==================================================================================================================
// validation
const isValid=function(value){
    if( (!value) ||typeof value==='undefined' || value===null) return false
    if(typeof value!='string') return false
    if(typeof value === 'string' && value.trim().length===0) return false
    return true
  }
let isbn = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/
let yearFormet = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/

// ============================================create-book============================================================

const createBook = async function (req,res){
try{
    let data = req.body

    let files= req.files
    if(files.length===0){
        return res.status(400).send({status:false,msg:"plz provide file"})
    }
 if (Object.keys(data).length == 0) 
{ return res.status(400).send({ status: false, msg: "Please enter details in the request Body" }) }

let {  title,excerpt, userId,ISBN,category,subcategory,releasedAt}=data

//authorization
let user= data.userId  
let userId1 = req.user.userId
if(user!=userId1)
return res.status(403).send({status: false , msg : "Not allowed to create book"})
   
//validation of fields
    if (!isValid(title)) { return res.status(400).send({ status: false, msg: "Please enter Title" }) }
    let usedTitle = await bookModel.findOne({ title: title })
    if (usedTitle) return res.status(400).send({ status: false, message: "This title has already been used" })

    if (!isValid(excerpt)) return res.status(400).send({ status: false, message: "Please enter excerpt" })
    
    if (!userId) return res.status(400).send({ status: false, message: "Please enter userId" })
    if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, msg: "invalid user id,Please Enter Valid userId" }) }
    
    let checkUserId = await userModel.findById(userId)
    if(!checkUserId)return res.status(404).send({status: false, msg : "No such User exists"})

    if (!ISBN) return res.status(400).send({ status: false, message: "Please enter ISBN no" })
    if (!isbn.test(ISBN)) return res.status(400).send({ status: false, message: "Please Enter Valid ISBN Number" })

    let usedISBN = await bookModel.findOne({ ISBN: ISBN })
    if (usedISBN) return res.status(400).send({ status: false, message: "This ISBN has already been used" })

    if (!isValid(category)) return res.status(400).send({ status: false, message: "Please enter category" })

    if (!isValid(subcategory)) return res.status(400).send({ status: false, message: "Please enter subcategory" })

    if (!releasedAt) return res.status(400).send({ status: false, message: "Please enter released date" })
    if (!yearFormet.test(releasedAt)) return res.status(400).send({ status: false, message: "Please Enter year formet of yyyy-mm-dd" })
    //validation ends

    //upload file
    let uploadedFileURL= await uploadFile( files[0] )
    console.log(uploadedFileURL)
      data.bookCover=uploadedFileURL
      console.log(data)

//creating document in db
    let createBook = await bookModel.create(data);
console.log(createBook)
    res.status(201).send({ status: true, message: 'Success', data: createBook })
    }
    catch (err) {
    res.status(500).send({ error: err.massage})
    }
}
// =========================================[getBookByQuery]===============================================================



const getBooks = async function (req, res) {
    try {
        let Data = req.query;
    
        let findData = await bookModel.find({$and:[Data, {isDeleted: false} ]}).select(
            { title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 })

            findData.sort(function(a,b){ 
                return a.title.localeCompare(b.title)
            })

        if (findData.length == 0)
            return res.status(404).send({ status: false, message: "No books found" })
        else
            res.status(200).send({ status: true, message: 'Books list', data: findData });
       }
       catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
   }

// =============================================[get-book-by-id]===========================================================================

const getBookById = async function (req, res) {

    try {
         let bookId = req.params.bookId
         bookId=bookId.trim()

         if(!bookId){ return res.status(400).send({status:false,message:"BookId is require"})}
         if (!mongoose.isValidObjectId(bookId)) { return res.status(400).send({ status: false, msg: "invalid bookid" }) }
       
         const checkbook = await bookModel.findById(bookId)

         if (!checkbook) return res.status(404).send({ status: false, message: "No book found" })
         if (checkbook.isDeleted===true) return res.status(404).send({ status: false, message: "book already deleted" })
   
        const reviewData = await reviewModel.find({bookId:bookId ,isDeleted:false}).select({_id:1,bookId:1,reviewedBy:1,reviewedAt:1,rating:1,review:1 })
        const countReview = await reviewModel.find({bookId:bookId}).count()
    
        let finalResult = {
            title: checkbook.title,
             excerpt: checkbook.excerpt,
            userId: checkbook.userId,
            category: checkbook.category,
            subcategory: checkbook.subcategory,
            isDeleted: checkbook.isDeleted, 
            reviews:countReview ,
             releasedAt: checkbook.releasedAt, 
             createdAt: checkbook.createdAt,
              updatedAt: checkbook.updatedAt, 
              reviewData: reviewData
        }

        return res.status(200).send({ status: true, message: 'Books ', data: finalResult });

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}



// ==============================================[updateBook]=================================================================

const updateBook = async (req, res) => {
    try {
        let Id = req.params.bookId
        if (!Id) return res.status(400).send({ status: false, msg: "plz provide bookId" })
       
        let data = req.body
        let { title, excerpt, releasedAt, ISBN } = data

        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Invalid Parameters" })

        if ((!mongoose.isValidObjectId(Id))) {
            return res.status(400).send({ status: false, msg: "Book Id is Invalid" })
        }

        let book = await bookModel.findById(Id).select({userId: 1})
        if (!book) {
            return res.status(404).send({ status: false, msg: `book with Id- ${Id} is not present in collection` })
        }
    
     let userId = book.userId
        let userId1 = req.user.userId
        //let d = userId
        if (userId1 != userId)
          return res.status(403).send({ status: false, msg: "Not allowed to modify data" })

        
        
        if (book.isDeleted == true) {
            return res.status(400).send({ status: false, msg: 'Document already deleted' })
        }

        const titleExist = await bookModel.findOne({ title: title })

        if (titleExist) {
            return res.status(400).send({ status: false, msg: "Title already exits" })
        }

        const isbnExist = await bookModel.findOne({ ISBN: ISBN })

        if (isbnExist) {
            return res.status(400).send({ status: false, msg: "ISBN already exits" })
        }

        let updatedBook = await bookModel.findOneAndUpdate(
            { _id: Id, isDeleted: false },
            {
                title: title,
                excerpt: excerpt,
                releasedAt: releasedAt,
                ISBN: ISBN,
            }, { new: true },
        )
        return res.status(200).send({ status: true, message: 'Success', data: updatedBook })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
// ==========================================[deleteBook]==============================================================

const deleteBook = async function (req, res) {
    try {
        let bookId = req.params.bookId
        bookId= bookId.trim()
        if (!bookId) return res.status(400).send({ status: false, msg: "plz provide bookId" }) 
        if(!mongoose.isValidObjectId(bookId)) { return res.status(400).send({ status: false, msg: "invalid bookid,Please Enter Valid bookid " }) }

        let checkbook = await bookModel.findById(bookId).select({userId:1})

        let userId = checkbook.userId
        let userId1 = req.user.userId

        if (userId1 != userId)
          return res.status(403).send({ status: false, msg: "Not allowed to delete data" })

          let checkbook2 = await bookModel.findById(bookId)

        if(!checkbook2)return res.status(404).send({ status: false, msg: " book not present " })


        if (checkbook2.isDeleted == true)return res.status(400).send({ status: false, msg: " already deleted" })
       
        let DeleteBlog = await bookModel.findOneAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })
        res.status(200).send({status:true,message:"deleted",data:DeleteBlog})
    }
    catch (err) {
        res.status(500).send({ error: err.message })
    }
}


module.exports = { createBook, getBooks, getBookById, updateBook, deleteBook ,}
// validateString
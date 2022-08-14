 
const userModel = require("../Models/userModel");
const jwt = require("jsonwebtoken");


 // =================================validation=================================================
       
        // regex
        const validPhoneNumber =  /^[0]?[6789]\d{9}$/;
        const  validPassword = /^[a-zA-Z0-9'@&#.\s]{8,15}$/;
        const emailValidator=/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
        let pin=/^[1-9][0-9]{5}$/

           const valid=function(value){
            if(typeof value==='undefined' || value===null) return false
            if(typeof value!='string') return false
            if(typeof value === 'string' && value.trim().length===0) return false
            return true
          }

        const numberCheck=function(value){
            if(typeof value === 'number') return true;
            return false;
          }


// // =================================createUser=================================================    
const createUser = async function (req, res) {

    try {
        res.setHeader('Access-Control-Allow-Origin','*')
        let userData = req.body ;

        if (Object.keys(userData).length == 0) 
        { return res.status(400).send({ status: false, msg: "Please enter details in the request Body " }) }

        let {title , name , phone , email, password , address} = userData  ;
        
        if(!title){
            return  res.status(400).send({status :false , message : "title is  Mandatory"})
        }
        if(!(["Mr", "Mrs", "Miss"].includes(title))){
            return  res.status(400).send({status :false , message : "title should be Mr Mrs Miss"})
        }
        if(numberCheck(name)){
            return  res.status(400).send({status :false , message : "name cant be number"})
        }
        if(!valid(name)){
            return  res.status(400).send({status :false , message : "name is  Mandatory"})
        }
        
        if(!phone){
            return  res.status(400).send({status :false , message : "phoneNumber is  Mandatory"})
        }
        if(!validPhoneNumber.test(phone)){
            return  res.status(400).send({status :false , message : "phoneNumber is incorrect"})
        }  
        if(!email){
            return  res.status(400).send({status :false , message : "email is  Mandatory"})
        }
        if(!emailValidator.test(email)) {
            return  res.status(400).send({status :false , message : "Provide email in correct format  "})
        } 
        if(!password){
            return  res.status(400).send({status :false , message : "password is  Mandatory"})
        }
        if(!validPassword.test(password)){
            return  res.status(400).send({status :false , message : "password Strength is Weak"})
        }
        let uniqueEmail = await userModel.findOne({email : email})
        if(uniqueEmail) {
            return  res.status(400).send({status :false , message : "Email already exist"})
        }
        let uniquePhone = await userModel.findOne({phone : phone})
        if(uniquePhone) {
            return  res.status(400).send({status :false , message : "Phone Number already exist"})
        }
  
        if(address){
            let street=address.street
            let city=address.city
            let pincode=address.pincode
    
            if(!valid(street)) return res.status(400).send({ status: false, message: "Please enter street" })
            if( numberCheck(street) )return res.status(400).send({ status: false, message: "street cant be Number" })
            if(!/[a-zA-Z][a-zA-Z ]+[a-zA-Z]$/.test(city)) return res.status(400).send({ status: false, message: "plz enter city correctly" })
            if(!pincode) return res.status(400).send({ status: false, message: "Please enter pincode" })
            if (!pin.test(pincode)) return res.status(400).send({ status: false, message: "Please Enter Valid pincode" })
             }
            
        let createUser = await userModel.create(userData);
        res.status(201).send({ status: true, message: 'Success', data: createUser })
    }
    catch (err) {
        res.status(500).send({ error: err.message })
    }
}
// ===================================================[loginUser]================================================================

const loginUser = async function (req, res) {
  try {
    let userName = req.body.email;
    let password = req.body.password;

if(!userName)
return res.status(400).send({ status: false, message: "Please enter username" })

if(!password)
return res.status(400).send({ status: false, message: "Please enter password" })

    let user = await userModel.findOne({ email: userName, password: password });
    if (!user)
      return res.status(400).send({
        status: false,
        msg: " username and password  not found plz log-in",
      });
    let token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      "functionup-radon", { expiresIn: '1d' }
    );
    res.setHeader("x-api-key", token);
    res.status(201).send({ status: true, message: 'Success', data: { token: token } });
  }
  catch (err) {
    console.log("This is the error :", err.message)
    res.status(500).send({ msg: "Error", error: err.message })
  }
}
module.exports = {createUser, loginUser}
const jwt = require('jsonwebtoken')

const authentication = function(req, res, next) {
    try{
        let token = req.headers["x-api-key" || "X-Api-Key"]
      if (!token) 
       return res.send({ status: false, msg: "token must be present" })
  
     jwt.verify(token,"functionup-radon", (err, user) => {
      if (err) 
          return res.status(401).send({msg: "invalid token"});
       req.user = user;
      // console.log(user)
        next();
  });
  }catch(err){
         res.status(500).send(err.message)
        }
}

module.exports = {authentication}

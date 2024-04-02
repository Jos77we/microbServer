const jwt = require("jsonwebtoken")
const asyncHandler = require('express-async-handler')
const User = require('../model/User')

const security = asyncHandler(async(req, res, next) => {
    let token

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
       try {
        
         //Get token
         token = req.headers.authorization.split(' ')[1]

         //Verify token
         const decoded = jwt.verify(token, process.env.JWT_SECRET)

         //Get user from token
         req.user = await User.findById(decoded.id).select('-password')

         next()
       } catch (error) {
        console.log(error)
        res.status(401)
        throw new Error('Not authorized')
        
       }
    }

    if(!token){
        res.status(401)
        throw new Error('Not authorized no token') 
    }
})

module.exports = {security}
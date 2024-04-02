const express = require('express')
const users = require('../model/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const {security} = require('../middleware/authMiddleware')


const router = express()

//create new user
router.post("/new" , asyncHandler(async (req, res) =>{
    const {name, email, password } = req.body

    if(!name || !email || !password){
        res.status(400)
        throw new Error('Please enter fields')
        
    }
    //Check if user exist

    const userExist = await users.findOne({email})

    if(userExist){
        res.status(400)
        throw new Error("User already exists")
    }

    //Hash password
    const salt = await bcrypt.genSalt(10)
    const hasedPassword = await bcrypt.hash(password, salt)
    
    //Create new user
    const user = await users.create({
        name,
        email,
        password: hasedPassword
    })

    if(user){
        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateJWT(user._id)
        })
    }else {
        res.status(400)
        throw new Error('Invalid credentials')
    }

}))

//Login user
router.post("/login" , asyncHandler(async(req, res) =>{
    const{email, password} = req.body

    //Confirm user by email and match the password
    const confirm = await users.findOne({email})

    if(confirm && (await bcrypt.compare(password, confirm.password))){
        const {name} = confirm
        res.status(200).json({
            name,
            message:"Login success",
             //token: generateJWT(confirm._id),
        })
        console.log(name)
    }else{
        res.status(400)
        throw new Error("Invalid login credentials")
    }
   
}))


//Get all users
router.get("/users", security, async(req, res) =>{
    try {
        const full = await users.find({})
    
        return res.status(200).json(full)
    } catch (error) {
      return res.status(400).json(error)
    }
   
})

//all users
router.get("/user-list", async(req, res) =>{
    const fullList = await users.find({})
    return res.status(200).json(fullList)
    
})

//Number of users
router.get("/count-users", async(req, res) =>{
    const countUsers = await users.count({})
    return res.status(200).json(countUsers)
    
})
//Generate JWT
const generateJWT = (id) =>{
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '20d'})
}

module.exports = router
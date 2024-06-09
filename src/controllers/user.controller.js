import { uploadOnCloudinary } from "../utils/Cloudinary.js" 
import { User } from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js" 
import { AsyncHandler } from "../utils/AsyncHandler.js"
import jwt from "jsonwebtoken"
import fs from "fs" ;
import { get, syncIndexes } from "mongoose"
import { emit } from "nodemon"
//general method to make both 
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId) ;
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


//register controller
const registerUser = AsyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullname, email, username, password } = req.body
    //console.log("email: ", email);
    console.log(req.files) ;

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath) 
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    console.log(coverImageLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )
//login controller
const loginUser = AsyncHandler(async (req ,res) => {
    //TODO
    //details either username or emial ans password 
    //check whether username exist or not 
    //if username doesnt exist throw message that user does not exist pls register 
    //do similar for email  if somebody is going by email 
    //if username is correct  find that user ans stored it in variable 
    //and check for password whether it is correct or not  
    //if password not correct throw error otherwise throw message that login successfull
    //if password correct and generate refresh token and access token 

    const {email , username , password} = req.body ; 
    
    console.log(req.cookies) ;
    if(!username && !email) {
        throw new ApiError(400 , "username or email id required") ;

    }
    const loginuser = await User.findOne({
        $or:[{username} , {email}]
    })
    console.log(loginuser)
    if(!loginuser){
        throw new ApiError(400 , "user does not  exist") ;
    }

    //checking password 
    const isPasswordvalid = await loginuser.isPasswordCorrect(password) ;
    if(!isPasswordvalid){
        throw new ApiError("password invalid") ;
    }
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(loginuser._id)

    const loggedInUser = await User.findById(loginuser._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

   
})
//logout 
const logOutUser = AsyncHandler(async(req  , res) => {
    
    await User.findByIdAndUpdate(req.user._id , {
        $set:{
            refreshToken:undefined
        }
    })
    const options = {
        httpOnly:true, 
        secure:true 
      }
    console.log(req.user) ;
    return res.status(200).clearCookie("accessToken ",  options).clearCookie("refershToken" , options) .json(
        new ApiResponse(200 , {user: req.user ,refreshToken: req.user.refershToken , accessToken:req.user.accessToken} ,"User loggedOUT Successfully"  )
    )

})
const refreshAcessToken = AsyncHandler(async(req , res) => {

    const incomingtoken  = req.cookies.refreshToken || req.body.refreshToken 
    if(!incomingtoken){
        throw new ApiError(401 , "unauthorized request") ;
    }

    try {
        const decoded = jwt.verify(incomingtoken , process.env.REFRESH_TOKEN_SECRET)  
        const user  = User.findById(decoded._id) ;
        if(!user){
            throw new ApiError(401, "invalid token") ;
        }
        //refresh Token expiry check 
        if(incomingtoken !==user?.refreshToken ) {
            throw new ApiError(401 , "refreshtoken expired") ;
        }
        const {accessToken, newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
      
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                     accessToken, newrefreshToken
                },
                "AccessToken refreshed"
            )
        )
    
    } catch (error) {
        
        throw new ApiError(401  , error.message || "refresh went wrong")
     }
})
const changePassword  = AsyncHandler(async(req , res)=> {
    const {oldPassword , newPassword} = req.body ; 
    

    const userid = req.user._id ;

    const  currentuser = await User.findById(userid) ;
    const isPasswordCorrect = await currentuser.isPasswordCorrect(oldPassword) ;
    if(!isPasswordCorrect){
        throw new ApiError(400 , "invalid Password") ;
    }
    
    currentuser.password = newPassword ;
   await currentuser.save({validateBeforeSave:false}) ;
   return res.status(200).json(new ApiResponse(200 ,  {}, "Password change succesfully" ))


    
   
    



})
const getCurrentUser = AsyncHandler(async(req ,res)=> {
    return res.status(200).json(200 ,  req.user , "Current User Fetched") ;

})
const UpdateAccount =  AsyncHandler(async(req , res)=>{
    
    const currentUser = await User.findById(req.user?._id) ;
    const  {fullname  , email , oldPassword} = req.body ;
    if(!fullname && !email) {
        throw new ApiError(400 ,  "field is required") ;
    }

    const isPasswordCorrect = await currentUser.isPasswordCorrect(oldPassword) ;
    if(!isPasswordCorrect){
        throw new ApiError(400 , "Password invalid") ;
    }

    currentUser.fullname  = fullname ;
    currentUser.email = email ;

   await currentUser.save({validateBeforeSave:false} ) ;
   const sendUser = User.findById(currentUser._id).select("-password -refreshToken") ;
   return res.status(200).json(200 , {user:sendUser , newemail:email  , newfullname:fullname}  , "Account Updated Successfully") ;



    

})
const UpdateUserAvatar = AsyncHandler(async(req ,res)=>{
    //old file unlink system 

    const currentUser = await User.findById(req.user._id) ;
    const oldfilePath = currentUser.avatar ;
    
    try {
        fs.unlinkSync(oldfilePath) ;
    } catch (error) {
        throw new ApiError(400 , error?.message||"Error while deleting avatar") ;
        
    }

    
    const newavatarLocalFilePath = req.file?.avatar[0]?.path ;
    if(!newavatarLocalFilePath){
        throw new ApiError(400 , "avatar file is missing") ;
    }   
    const avatar = await uploadOnCloudinary(newavatarLocalFilePath) ;
    if(!avatar.url){
        throw new ApiError(400 , "error while uploading")  ;
    }   

    const user = await User.findByIdAndUpdate(req.user?.id ,  {avatar:avatar.url} ,  {new :true}) ;

    return res.status(200).json(new ApiResponse(200 ,{user:user,newavatarurl:avatar.url} ,  "avatar changed successfully"))





})
//similarly coverImage can be updated 


export {registerUser ,  loginUser , logOutUser , refreshAcessToken , changePassword , getCurrentUser , UpdateAccount , UpdateUserAvatar}
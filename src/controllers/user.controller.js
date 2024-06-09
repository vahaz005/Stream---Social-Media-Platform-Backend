import { uploadOnCloudinary } from "../utils/Cloudinary.js" 
import { User } from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js" 
import { AsyncHandler } from "../utils/AsyncHandler.js"
//general method to make both 
const generateTokens = async (userid) => {
    try {
        const user = await User.findById(userid) ;
       const AcessToken = await user.Acesstokengenerator() ;
       const RefreshToken =await user.Refreshtokengenerator()  ;
       user.refreshToken = RefreshToken ;
       user.save({validateBeforeSave : false}) //save the user 
       return {AcessToken , RefreshToken}

       

    } catch(error) {
        throw new ApiError(500 , "somethinf went wrogn while generating tokens") ;


    }


}

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
    console.log(req.files.avatar[0].path) 
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

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
const loginUser = AsyncHandler(async (req ,res) => {
    //details either username or emial ans password 
    //check whether username exist or not 
    //if username doesnt exist throw message that user does not exist pls register 
    //do similar for email  if somebody is going by email 
    //if username is correct  find that user ans stored it in variable 
    //and check for password whether it is correct or not  
    //if password not correct throw error otherwise throw message that login successfull
    //if password correct and generate refresh token and access token 

    const {email , username , password} = req.body ; 
    if(!username && !email) {
        throw new ApiError(400 , "username or password id required") ;

    }
    const loginuser = await User.findOne({
        $or:[{username} , {email}]
    })
    if(!loginuser){
        throw new ApiError(400 , "user does not  exist") ;
    }

    //checking password 
    const isPasswordvalid = await loginuser.isPasswordCorrect(password) ;
    if(!isPasswordvalid){
        throw new ApiError("password invalid") ;
    }

  const {accesToken  ,refreshToken} =  await generateTokens(loginuser._id) ; 

  const loggedinUser = loginuser.select("-password -refreshToken")
  const options = {
    httpOnly:true, 
    secure:true 
  }

  return res.status(200).cookie("accessToken " , accesToken , options   ).cookie("refreshToken " , refreshToken , options).json(
    new ApiResponse(200 ,  { user:loggedinUser , refreshToken , accesToken

}, "user logged in successfully")
  )
 


})
//logout 
const logOutUser = AsyncHandler(async(req  , res) => {
   const loggedoutUser = await User.findByIdAndUpdate(req.user._id , {
        $set:{
            refreshToken:undefined
        }
    })
    const options = {
        httpOnly:true, 
        secure:true 
      }
    
    return res.status(200).clearCookie("accessToken ",  options).clearCookie("refershToken" , options) .json(
        new ApiResponse(200 , {} ,"User loggedOUT Successfully"  )
    )

})

export {registerUser ,  loginUser , logOutUser}
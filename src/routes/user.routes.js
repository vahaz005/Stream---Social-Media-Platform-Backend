import { Router } from "express";
import { logOutUser, loginUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const  userrouter = Router() 
userrouter.route("/register").post( upload.fields([
    {
        name:"avatar" ,
        maxCount:1
    } ,
    {
        name:"coverImage" ,
        maxCount:1 
    }
]

),registerUser)

userrouter.route("/login").post(loginUser) ;
userrouter.route("/logout").post( verifyJWT,logOutUser) ;  //thats why we put next so that we can  use multiple middlewares on
// single route 



export  {userrouter }

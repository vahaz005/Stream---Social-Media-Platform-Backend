//it will check whether user is their or not 

import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { AsyncHandler } from "../utils/AsyncHandler";
import jwt from "jsonwebtoken" ;

export const  verifyJWT = AsyncHandler(async (req , res ,next) => {
    
   try {
    const token  = await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")  ;
    if(!token){
     throw new ApiError(401 , "Unauthorized request") ;
    }
 
   const decodedinfo =  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET) ; 
 
  const user  =  await User.findById(decodedinfo?._id).select("-password -refreshtoken") ;
 
  if(!user ){
     //TODO NEXT VEDIO
     throw new ApiError(401 , "invalid access token ") ;
  }
 
 req.user = user ;
 next() ;
 
   } catch (error) {
    throw new ApiError(401 , error?.message || "invalid access") ;
    
   }

})
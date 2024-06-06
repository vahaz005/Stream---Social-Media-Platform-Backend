import mongoose from "mongoose";
import bcrypt from "bcrypt" ;
import jwt from "jsonwebtoken";
import { Schema } from "mongoose"; 
const UserSchema =  new Schema({
     username  : {
        type : String ,
        required:true ,
        unique:true ,
        lowercase:true ,
        trim : true ,
        index :true , // database searching     
     }, 
    email  : {
        type : String ,
        required:true ,
        unique:true ,
        lowercase:true ,
        trim : true ,
         // database searching     
     }, 
     fullname : {
        type : String ,
        required:true ,
       index:true ,
       
        trim : true ,
         // database searching     
     }, 
     avatar  : {
        type:String , //cloudanary url 
        required:true ,
           
     }, 
     coverImage : {
        type:String ,  

     } ,
      Watchhistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Vedio" ,
        }
      ] , 
      password : {
        type:String ,
        required:[true ,"password is required"] 
      } ,
      refreshToken :{
        type:String 

      },

     

} ,
 {
    timestamps:true ,
 }) 
 UserSchema.pre("save"  , async function(next) { //arrow function donot have this functionality 
    if(!this.isModified("password")) return next() ;
    this.password=bcrypt.hash(this.password, 10) //password encryption  //middlewade made 
next()

 }  )

 UserSchema.methods.isPasswordCorrect = async function (password) {
  return  await  bcrypt.compare(password,this.password)  ; //comparision of stringpassword  with encryption one  s


 }

 UserSchema.methods.Acesstokengenerator = async function () {
   return  jwt.sign(
        {
            _id :this._id , //mongoode id 
            email:this.email ,
            username:this.username ,
            fullname:this.fullname
        } ,
        process.env.ACCESS_TOKEN_SECERT,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY 
        }


)

 }
 UserSchema.methods.Refreshtokengenerator = async function () {
    return  jwt.sign(
         {
             _id :this._id , //mongoode id  they do  not have much payload 
            
         } ,
         process.env.REFRESH_TOKEN_SECERT,
         {
             expiresIn:process.env.REFRESH_TOKEN_EXPIRY 
         }
 
 
 )
 
  }
export const User  =  mongoose.model("USER" ,  UserSchema) ;



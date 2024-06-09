import express from "express" ;
import cors from "cors" 
import cookieParser from "cookie-parser";


const app = express() 
app.use(cors({
    origin : process.env.CORS_ORIGIN ,
    credentials:true ,

}
))
app.use(express.json({limit:"4000kb"})) // json form data limit   
app.use(express.urlencoded({extended:true , limit:"40000kb"})) //request in formm of url 
app.use(express.static("public")) //images favicon 
app.use(cookieParser()) //server cookies handling

//routes 
import { userrouter } from "../routes/user.routes.js"; 
//routes declaration  
app.use("/api/v1/users" , userrouter)




export {app} 

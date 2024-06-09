
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./utils/App.js";

dotenv.config({
path: './.env'
})



connectDB()
.then(() => {
    app.listen( 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("MONGO db connection failed !!! ", error);
process.exit(1);
})
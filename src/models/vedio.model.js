import mongoose from "mongoose"; 
import mongooseaggregatePaginate from "mongoose";
import { Schema } from "mongoose"; 
import { aggregatePaginate } from "mongoose-aggregate-paginate-v2";
const VedioSchema  = new Schema({
    Vediofile:{
        type:String, 
        required:true ,

    } , 
    Thumbnail: {
        type:String ,
        required:true  ,
    }
     ,
     owner : {
         type:Schema.Types.ObjectId , 
         ref :"USER" ,
     } ,
     title : {
        type:String , 
        required:true , 
     } , 
     description : {
        type:String ,
        required:true, 
        
     } , 
     Duration : {
        type:number ,
        required:true , 

     } ,
     views : {
        type : number ,
        default:0
     }
      ,
      isPublished : {
        type : Boolean ,
      } 




}
 , 
  {
    timestamps : true, 
  }
) 
VedioSchema.plugin(mongooseaggregatePaginate)

export const Vedio = mongoose.model("Vedio " , VedioSchema) ;

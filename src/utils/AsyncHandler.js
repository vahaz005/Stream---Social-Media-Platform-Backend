const AsyncHandler = (requesthandler) => async  (req , res, next ) => { 
try{
await requesthandler(req , res , next) ;
} catch(error){
    res.status(err.code||500).json({
        success:false ,
        message:err.message 
    })
}



}
export {AsyncHandler}
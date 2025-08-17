export const errorHandler=(err,req,res,next)=>{
    console.error(err);
    if(err.statusCode){
        return res.status(err.statusCode).json({
            success:false,
            error: err.name,
            message: err.message,
        });
    }
    res.status(500).json({success:false,
        error: 'InternalServerError',
        message: 'Something went wrong',
    })
}

import multer from 'multer';
import path from 'path';

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'/usr/src/app/uploads');
    },
    filename:(req,file,cb)=>{
        const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1e9);
        cb(null,`${uniqueSuffix}-${file.originalname}`);
    },
});

function checkFileType(file,cb){
    const filetypes=/jpeg|jpg|png|gif/;
    const extname=filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype=filetypes.test(file.mimetype);
    if(mimetype && extname){
        return cb(null,true);
    }else{
        cb("Error: Images only! (jpeg,jpg,png,gif)")
    }
}

const upload=multer({
    storage: storage,
    fileFilter: function(req,file,cb){
        checkFileType(file,cb);
    }
});

export const uploadMiddleware=upload.any();
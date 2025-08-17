
import path from 'path';
import fs from 'fs';


export async function deleteFile(filePath){
    try{
        const absolutePath=path.resolve(filePath);
        await fs.promises.unlink(absolutePath);
        
    }catch(error){
        if(err.code==='ENOENT'){
            console.warn(`File not found, skipping: ${filePath}`);
        }else{
            console.error(`Error deleting file: ${filePath}`,err);
        }
    }
}
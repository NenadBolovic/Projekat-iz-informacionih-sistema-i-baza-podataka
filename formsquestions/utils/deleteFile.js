
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = '/usr/src/app/uploads'; 

export async function deleteFile(filePath) {
    try {
        const filename = path.basename(filePath);
        const absolutePath = path.join('/usr/src/app/uploads', filename);

        await fs.promises.unlink(absolutePath);
        console.log(`File deleted: ${absolutePath}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`File not found, skipping: ${filePath}`);
        } else {
            console.error(`Error deleting file: ${filePath}`, error);
        }
    }
}



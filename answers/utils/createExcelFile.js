import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);

export function createExcelFile(formId, answersWithUsernames) {
    const ws = XLSX.utils.json_to_sheet(answersWithUsernames);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Answers');

    const downloadsDir = path.resolve('./downloads');  
    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const downloadPath = path.join(downloadsDir, `answers${formId}.xlsx`);
    XLSX.writeFile(wb, downloadPath);

    return downloadPath;
}
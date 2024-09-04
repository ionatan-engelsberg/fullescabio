import multer from 'multer';
import path from 'path';

const storageExcel = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
});

const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase(); 
    if (fileExtension === '.xlsx') {
        cb(null, true); 
    } 
};

const uploadExcel = multer({
    storage: storageExcel,
    fileFilter
})

export default uploadExcel
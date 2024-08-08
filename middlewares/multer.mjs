import multer from 'multer';
import path from 'path';

const storageExcel = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Carpeta donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
});

const uploadExcel = multer({
    storage: storageExcel
})

export default uploadExcel
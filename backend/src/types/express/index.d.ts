declare namespace Express {
  export interface Request {
    file?: import('multer').Multer['File']
    files?: import('multer').Multer['File'][]
  }
} 
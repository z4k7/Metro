const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cB) => {
    /**cB means callback */

    cB(null, path.join(__dirname, "../public/multerImg"));
  },
  filename: async (req, file, cB) => {
    const fileName = Date.now() + "-" + file.originalname;
    cB(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  imageLimit: 4,
});

module.exports = upload;

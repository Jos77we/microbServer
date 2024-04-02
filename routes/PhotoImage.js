const express = require("express");
// const asyncHandler = require("express-async-handler");
const photos = require("../model/Image");
const multer = require("multer");
const router = express();

const storage = multer.memoryStorage(); // Save the file in memory as a Buffer

// File filter to accept only image files (modify as per your requirements)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image files are allowed."));
  }
};

const upload = multer({ storage, fileFilter });

function generateRandomId(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
}

const randomId = generateRandomId(10);

router.post("/new-image", upload.single("image"), async (req, res) => {
    try {
      const newProduct = new photos({
        userID: randomId,
        title: req.body.title,
        image: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        },
      });
  
      await newProduct.save();
  
      res.status(200).json({ message: "Successful upload" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error." });
    }
  });
  
//   router.get("/images", (req, res) => {
//     photos.find({}).then((title, image, err) => {
//       if (err) {
//         console.log(err);
//       }
//       res.send(title, image);
//     });
//   });

router.get("/images", async (req, res) => {
    try {
      const allDoc = await photos.find()
  
      const documentsWithBase64Image = allDoc.map((doc) => ({
        ...doc.toObject(),
        image: {
          data: doc.image.data.toString('base64'), // Convert the buffer to base64 string
          contentType: doc.image.contentType,
        },
      }));
  
      res.json(documentsWithBase64Image);
  
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

  module.exports = router;
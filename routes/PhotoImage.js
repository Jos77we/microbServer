const express = require("express");
// const asyncHandler = require("express-async-handler");
const photos = require("../model/Image");
const multer = require("multer");
const router = express();
const crypto = require('crypto');

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

function generateRandomString(length) {
  return new Promise((resolve, reject) => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let result = '';
      crypto.randomBytes(length, (err, buf) => {
          if (err) {
              reject(err);
              return;
          }
          for (let i = 0; i < buf.length; i++) {
              result += chars.charAt(buf[i] % chars.length);
          }
          resolve(result);
      });
  });
}


router.post("/new-image", upload.single("image"), async (req, res) => {
    try {

      const randomId = await generateRandomString(10);

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
  
  router.get("/all-images", (req, res) => {
    photos.find({}).then((title, image, err) => {
      if (err) {
        console.log(err);
      }
      res.send(title, image);
    });
  });

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

  router.get("/latest-photos", async (req, res) => {
    try {
     const latestPhotos = await photos.find().sort({ createdAt: -1 }).limit(4);
     
    if (!latestPhotos || latestPhotos.length === 0) {
      return res.status(404).json({ message: "No photos found." });
    }

    // Extract necessary data from the latest photo
    const { title, image } = latestPhotos[0]; // Assuming you want to get data from the latest photo

    // Check if image data exists
    if (!image || !image.data) {
      return res.status(404).json({ message: "No image data found." });
    }

    // Convert image data to base64
    const imageBase64 = image.data.toString("base64");

    res.json({
      title,
      image: imageBase64,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
  module.exports = router;
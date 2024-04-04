const express = require('express');
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const multer = require('multer');
const photos = require("../model/Image");
const path = require('path');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });


// Your Clarifai configuration
const PAT = '99da18fe5ca043db9359b9896128ea5a';
const USER_ID = 'openai';
const APP_ID = 'chat-completion';
const MODEL_ID = 'openai-gpt-4-vision';
const MODEL_VERSION_ID = '266df29bc09843e0aee9b7bf723c03c2';
// const IMAGE_URL = "https://samples.clarifai.com/metro-north.jpg";
// const IMAGE_FILE_LOCATION = 'C:\\Users\\Joseph\\Desktop\\microbServer\\images\\LeafImage.jpg';
// const RAW_TEXT = "Provide a detailed description of the image, what it is and where it is found";

const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + PAT);

const fs = require("fs");
// const imageBytes = fs.readFileSync(IMAGE_FILE_LOCATION);

// Function to interact with Clarifai model
// async function predict(imageBytes, text) {
//   return new Promise((resolve, reject) => {
//     stub.PostModelOutputs(
//       {
//         user_app_id: {
//           "user_id": USER_ID,
//           "app_id": APP_ID
//         },
//         model_id: MODEL_ID,
//         version_id: MODEL_VERSION_ID,
//         inputs: [
//           {
//               "data": {
//                   "text": {
//                       "raw": text,
//                       // url: TEXT_FILE_URL,
//                       // raw: fileBytes
//                   },
//                   "image": {
//                       "base64": imageBytes                      
//                   }
//               }
//           }
//       ],
//       model: {
//           "model_version": {
//               "output_info": {
//                   "params": {
//                       "temperature": 0.5,
//                       "max_tokens": 2048,
//                       "top_p": 0.95
//                       // "api_key": "ADD_THIRD_PARTY_KEY_HERE"
//                   }
//               }
//           }
//       }
//   },
//   metadata,
//   (err, response) => {
//       if (err) {
//           throw new Error(err);
//       }

//         if (response.status.code !== 10000) {
//           reject(new Error("Post model outputs failed, status: " + response.status.description));
//           return;
//         }

//         const output = response.outputs[0];
//         resolve(output.data.text.raw);
//       }
//     );
//   });
// }
// Function to interact with Clarifai model
async function predict(imagePath, text) {
  try {
      const imageBytes = fs.readFileSync(imagePath);

      return new Promise((resolve, reject) => {
          stub.PostModelOutputs(
              {
                  user_app_id: {
                      user_id: USER_ID,
                      app_id: APP_ID
                  },
                  model_id: MODEL_ID,
                  version_id: MODEL_VERSION_ID,
                  inputs: [
                      {
                          data: {
                              text: {
                                  raw: text
                              },
                              image: {
                                  base64: imageBytes
                              }
                          }
                      }
                  ],
                  model: {
                      model_version: {
                          output_info: {
                              params: {
                                  temperature: 0.5,
                                  max_tokens: 2048,
                                  top_p: 0.95
                              }
                          }
                      }
                  }
              },
              metadata,
              (err, response) => {
                  if (err) {
                      reject(new Error(err));
                  }

                  if (response.status.code !== 10000) {
                      reject(new Error('Post model outputs failed, status: ' + response.status.description));
                      return;
                  }

                  const output = response.outputs[0];
                  resolve(output.data.text.raw);
              }
          );
      });
  } catch (error) {
      throw new Error(error);
  }
}


router.get('/get-image', async (req, res) => {
  try {
    const { userID } = req.query;
      if (!userID) {
          return res.status(400).json({ message: 'userId parameter is required' });
      }

      // Retrieve image from MongoDB based on userId
      const imageDocument = await photos.findOne({userID: { $in: userID }});
      if (!imageDocument) {
          return res.status(404).json({ message: 'No image found for the provided userId' });
      }

      // Extract the binary image data from the image document
    const imageBytes = Buffer.from(imageDocument.image.data);

    console.log(imageBytes)

    // Define the path where you want to save the image
    const imagePath = path.resolve(__dirname, '..', 'images', `${userID}.jpg`); // Assuming the image format is JPG

    // Write the image bytes to the file
    fs.writeFile(imagePath, imageBytes, async (err) => {
      if (err) {
        console.error('Error saving image:', err);
        return res.status(500).json({ message: 'Error saving image' });
      }

      try {
        // Predict using the image path and text
        const prediction = await predict(imagePath, "Explain what the image is about, how it functions and where it can be found");
        // Return the prediction result as response
        return res.status(200).json({ prediction });
      } catch (error) {
        console.error('Prediction error:', error);
        return res.status(500).json({ message: 'Error in prediction' });
      }
    });
      // // Write image to a temporary file
      // const tempImagePath = path.join('C:\\Users\\Joseph\\Desktop\\microbServer\\images', `temp_image_${userID}.jpg`);
      // fs.writeFileSync(tempImagePath, imageBytes);

      // // Call the predict function
      // const prediction = await predict(tempImagePath, 'Provide a detailed description of the image, what it is and where it is found');

      // // Remove temporary image file
      // fs.unlinkSync(tempImagePath);

      // // Send the prediction as response
      // res.json({ prediction });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

router.get("/ai-image", async(req, res) => {
    const { userID } = req.query;
    //const brands = brandNames.split(',');
    
    try {
      
      const oneLogo = await photos.find({userID: { $in: userID }});

      const documentsWithBase64Image = oneLogo.map((doc) => ({
        ...doc.toObject(),
        image: {
          data: doc.image.data.toString('base64'), // Convert the buffer to base64 string
          contentType: doc.image.contentType,
        },
      }));
      
      if (!documentsWithBase64Image) {
        return res.status(500).json({ message: "Image data conversion failed." });
      }

      res.json(documentsWithBase64Image);
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Server error." });
    }
  })

  router.get('/predict-ai', async (req, res) => {
    try {
      // Call the predict function
      const predictionResult = await predict();
  
      // Send the prediction result as the response
      res.status(200).json({ prediction: predictionResult });
    } catch (error) {
      console.error("Prediction error:", error);
      res.status(500).json({ error: 'An error occurred while making the prediction' });
    }
  });

  router.get('/api/images', async (req, res) => {
    const { userID } = req.query;
    try {
      const images = await photos.find({ userID });
      if (!images) {
        return res.status(404).json({ message: 'Images not found' });
      }
      // Assuming you want to send all images found for the given userID
      const imageArray = images.map(image => ({
        contentType: image.image.contentType,
        data: image.image.data.toString('base64')
      }));
      res.json(imageArray);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

module.exports = router;


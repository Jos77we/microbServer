const express = require('express');
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const photos = require("../model/Image");
const router = express.Router();
const path = require('path');
const fs = require("fs");

// Your Clarifai configuration
const PAT = '99da18fe5ca043db9359b9896128ea5a';
const USER_ID = 'openai';
const APP_ID = 'chat-completion';
const MODEL_ID = 'openai-gpt-4-vision';
const MODEL_VERSION_ID = '266df29bc09843e0aee9b7bf723c03c2';

const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + PAT);

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
       res.status(200).json({ prediction });

       // Delete the image file after sending the response
       fs.unlink(imagePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting image:', unlinkErr);
        }
      });

      } catch (error) {
        console.error('Prediction error:', error);
        return res.status(500).json({ message: 'Error in prediction' });
      }
    });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


module.exports = router;


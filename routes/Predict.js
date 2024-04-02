const express = require('express');
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const photos = require("../model/Image");

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
async function predict(imageData, text) {
  return new Promise((resolve, reject) => {
    stub.PostModelOutputs(
      {
        user_app_id: {
          "user_id": USER_ID,
          "app_id": APP_ID
        },
        model_id: MODEL_ID,
        version_id: MODEL_VERSION_ID,
        inputs: [
          {
            "data": {
              "image": {
                "base64": imageData
              },
              "text": {
                "raw": text
              }
            }
          }
        ]
      },
      metadata,
      (err, response) => {
        if (err) {
          reject(err);
          return;
        }

        if (response.status.code !== 10000) {
          reject(new Error("Post model outputs failed, status: " + response.status.description));
          return;
        }

        const output = response.outputs[0];
        resolve(output.data.text.raw);
      }
    );
  });
}

// Create and export the router

  const router = express.Router();

  router.post('/image-ai', async (req, res) => {
    try {
      const { userId } = req.body;

      // Retrieve image data from MongoDB based on userId using Mongoose
      const image = await photos.findOne({ userId });

      if (!image.data || !image.data.buffer) {
        return res.status(404).json({ error: 'Image not found for the provided userId' });
      }

      // Assuming image data is stored as a base64 string in the imageData field
       const imageDataBinary = image.data;
       const imageDataBase64 = imageDataBinary.buffer.toString('base64');

      const text = 'Provide a description of the image, what it is, its parts, how it functions and where it can be found';

      // Make prediction using Clarifai model
      const result = await predict(imageDataBase64, text);
      
      // Do something with the result
      res.json({ result });
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({ error: 'Prediction failed' });
    }
  });


module.exports = router;


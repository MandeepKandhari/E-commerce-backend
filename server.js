const express = require('express');
const watson = require('watson-developer-cloud');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const vcapServices = require('vcap_services');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('file-system');

const app = express();
app.use(bodyParser.json());
app.use(cors());



const PORT = process.env.PORT || 3002;

const sttAuthService = new watson.AuthorizationV1(
  Object.assign(
    {
      username: process.env.SPEECH_TO_TEXT_USERNAME, 
      password: process.env.SPEECH_TO_TEXT_PASSWORD
    },
    vcapServices.getCredentials('speech_to_text') 
  )
);

app.use('/api/speech-to-text/token', (req, res)=> {
  sttAuthService.getToken(
    {
      url: watson.SpeechToTextV1.URL
    },
    function(err, token) {
      if (err) {
        console.log('Error retrieving token: ', err);
        res.status(500).send('Error retrieving token');
        return;
      }
      res.send(token);
    }
  );
});
app.listen(PORT);

var express = require('express');
var router = express.Router();
const fileUpload = require('express-fileupload');
router.use(fileUpload());
var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'ddb9lp3zy',
  api_key: '198698781656522',
  api_secret: 'Nbi5-V9NTnEg30RQ9UAxy69eq1Q'
});

var mongoose= require('mongoose');
var options = { server: { socketOptions: {connectTimeoutMS: 5000 } }};
mongoose.connect('mongodb://yoannherlaut:azerty1@ds247101.mlab.com:47101/locapic',
    options,
    function(err) {
     console.log(err);
    }
);



const request = require('request');

// Replace <Subscription Key> with your valid subscription key.
const subscriptionKey = '228b343f9e194e159a508cded45087fe';

// You must use the same location in your REST call as you used to get your
// subscription keys. For example, if you got your subscription keys from
// westus, replace "westcentralus" in the URL below with "westus".
const uriBase = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect';

// Request parameters.
const params = {
    'returnFaceId': 'true',
    'returnFaceLandmarks': 'false',
    'returnFaceAttributes': 'age,gender,headPose,smile,facialHair,glasses,' +
        'emotion,hair,makeup,occlusion,accessories,blur,exposure,noise'
};


var pictureSchema = mongoose.Schema({
  url:String,
  latitude:String,
  longitude:String,
  faceId:String,
  gender:String,
  age:Number,
  smile:Number
})
var pictureModel = mongoose.model('picture', pictureSchema)


var userSchema = mongoose.Schema({
  faceId:String,
  username:String,
})
var userModel = mongoose.model('user', userSchema)



router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// NOM DE PHOTO DYNMIC
var i = 0;

router.post('/upload', function(req, res) {




// FILEPATH DYNAMIC >> DRY (don't repeat yourself! Aka Thierry!)
let photoPath = `public/images/nomImageAChoisir-${i}.jpg`;

i++;
  //recup l'image depuis le front
let filename = req.files.photo;

// envoyer l'image dans le dossier publi/images en mettant le nom et le format de l'image
 filename.mv(photoPath, function(err) {
   if (err){
     return res.status(500).send(err);
   }
   cloudinary.v2.uploader.upload(photoPath,
    function(error, result){
      if(result){

        const option = {
            uri: uriBase,
            qs: params,
            body: '{"url": ' + '"' + result.url + '"}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKey
            }
        };

        request.post(option, (error, response, body) => {
          if (error) {
            console.log('Error: ', error);
            return;
          }
          var value = JSON.parse(body);

          var newPicture = new pictureModel({
            url:result.secure_url,
            latitude:req.body.lat,
            longitude:req.body.lng,
            faceId: value[0].faceId,
            gender:value[0].faceAttributes.gender,
            age:value[0].faceAttributes.age,
            smile:value[0].faceAttributes.smile
          })

          newPicture.save(function(err, picture){
            console.log("photo OK");
          })

          console.log(req.body.name);
          var newUser = new userModel({
            faceId:value[0].faceId,
            username:req.body.name
          })

          newUser.save(function(err, user){
            console.log("user OK");
          })

        });

        res.send(`File uploaded --> ${result}`);
      } else if (error) {
        res.send(error);
      }
    });
    // res.send à intégrer dans la fonction de call back
 });
});



router.get('/displayPicture', function(req, res, next) {

  pictureModel.find(function(err, picture){
    console.log("PHOTO RECUP",picture);
    res.json(picture)
  })

});


router.get('/coordsMaps', function(req, res, next) {

  pictureModel.find(function(err, picture){
    res.json(picture)
  })

});




module.exports = router;

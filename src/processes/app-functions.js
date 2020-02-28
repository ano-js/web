const MongoClient = require("mongodb").MongoClient;

const storeAnimationRepoData = (req, res) => {
  // Inserting GitHub animations repo data into MongoDB
  let animationFilesData = [];
  axios.get(repoDataLink).then((response) => {
    const fileObjects = response.data;

    // Filtering JSON response for useful data
    // Including name, idName, cdnLink, videoLink
    for (animationFile of fileObjects) {
      const animationFileName = animationFile.name;

      // Formatting name
      // Splitting filename on "-"
      const splitFileName = animationFileName.split("-");

      // Removing "anojs" from filename list
      splitFileName.shift();

      // Formatting idName
      let idName = splitFileName.join("-");
      idName = idName.substring(0, idName.length - 3)

      // Pulling formatted name together
      let name = splitFileName.join(" ");

      // Getting rid of ".js" from last word
      name = name.substring(0, name.length - 3);

      // Capitalizing all words in filename
      name = name.replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase());

      // Formatting CDN link
      const cdnLink = baseCdnLink + animationFileName;

      // Formatting S3 video link
      const videoName = name.split(" ").join("+");
      const videoLink = `https://anojs.s3.us-east-2.amazonaws.com/${videoName}.mov`

      animationFilesData.push({
        name,
        idName,
        cdnLink,
        videoLink
      })
    }

    MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) throw err;

      const animationsCollection = client.db("anojs").collection("animations");

      // Clearing out entire collection
      animationsCollection.drop((err, deleteConfirmation) => {
        if (err) throw err;
        if (deleteConfirmation) console.log("Collection cleared");
      });

      // Inserting all animations into collection
      animationsCollection.insertMany(animationFilesData);
    })
  }).catch((err) => {
    console.error(err);
  });

  res.status(200).send();
}

const storeCollaboratorRepoData = (req, res) => {
  axios.get(repoCollaboratorsLink, {
    headers: {
      "Authorization": "token " + personalAccessToken
    }
  }).then((response) => {

    const collaborators = response.data;

    // Saving all collaborators in MongoDB
    MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) throw err;

      const collaboratorsCollection = client.db("anojs").collection("collaborators");

      // Clearing out collection
      collaboratorsCollection.drop((err, deleteConfirmation) => {
        if (err) throw err;
        if (deleteConfirmation) console.log("Collection cleared");
      });

      // Inserting all collaborators
      collaboratorsCollection.insertMany(collaborators);
    });

  }).catch((err) => {
    console.error(err);
  });

  res.status(200).send();
});


module.exports = { storeAnimationRepoData, storeCollaboratorRepoData }

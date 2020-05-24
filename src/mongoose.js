const mongoose = require("mongoose");

const animationModel = mongoose.model("Animation", new mongoose.Schema({
  name: String,
  idName: String,
  cdnLink: String,
  imageLink: String,
  animationContributor: String,
  animationParameters: Array,
  useCounter: Number
}));

const animationCounterModel = mongoose.model("AnimationCounter", new mongoose.Schema({
  idName: String,
  counter: Number
}));

const contactModel = mongoose.model("Contact", new mongoose.Schema({
  email: String,
  githubUsername: String
}));

const contributorModel = mongoose.model("Contributor", new mongoose.Schema({
  login: String,
  id: Number,
  node_id: String,
  avatar_url: String,
  gravatar_id: String,
  url: String,
  html_url: String,
  followers_url: String,
  gists_url: String,
  starred_url: String,
  subscriptions_url: String,
  organizations_url: String,
  repos_url: String,
  events_url: String,
  received_events_url: String,
  type: String,
  site_admin: Boolean,
  permissions: Object
}));

module.exports = { animationModel, animationCounterModel, contactModel, contributorModel }

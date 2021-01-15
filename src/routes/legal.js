const fs = require("fs");

module.exports = function(app) {

  app.use("/robots.txt", (req, res, next) => {
    const filePath = __dirname + "/../static/files/robots.txt";
    fs.readFile(filePath, (err, data) => {
      res.send(data);
    });
  });

  app.use("/sitemap.xml", (req, res, next) => {
    const filePath = __dirname + "/../static/files/sitemap.xml";
    fs.readFile(filePath, (err, data) => {
      res.send(data);
    });
  });

  app.get("/ads.txt", (req, res) => {
    const filePath = __dirname + "/../static/files/ads.txt";
    fs.readFile(filePath, (err, data) => {
      res.send(data);
    });
  });

  app.get("/legal/terms-of-use.pdf", (req, res) => {
    const filePath = __dirname + "/../static/files/terms-of-use.pdf";
    fs.readFile(filePath, (err, data) => {
      res.contentType("application/pdf");
      res.send(data);
    });
  });

  app.get("/legal/privacy-policy.pdf", (req, res) => {
    const filePath = __dirname + "/../static/files/privacy-policy.pdf";
    fs.readFile(filePath, (err, data) => {
      res.contentType("application/pdf");
      res.send(data);
    });
  });

  app.get("/credits", (req, res) => {
    res.render("credits.html");
  });

  app.get("/arc-sw.js", (req, res) => {
    const filePath = __dirname + "/../static/files/arc-sw.js";
    fs.readFile(filePath, (err, data) => {
      res.contentType("application/javascript");
      res.send(data);
    });
  });
}

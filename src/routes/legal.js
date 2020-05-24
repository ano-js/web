module.exports = function(app, blockElements) {

  app.use("/robots.txt", (req, res, next) => {
    res.sendFile(__dirname + "/robots.txt");
  });

  app.use("/sitemap.xml", (req, res, next) => {
    res.sendFile(__dirname + "/sitemap.xml");
  });

  app.get("/terms-and-conditions", (req, res) => {
    res.render("terms_and_conditions.html", context={ blockElements });
  });

  app.get("/privacy-policy", (req, res) => {
    res.render("privacy_policy.html", context={ blockElements });
  });

  app.get("/credits", (req, res) => {
    res.render("credits.html", context={ blockElements });
  });
}

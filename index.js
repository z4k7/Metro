const userRouter = require("./routes/userRoute");
const adminRouter = require("./routes/adminRoute");
const mongoose = require("mongoose");
const flash = require("express-flash");
const nocache = require("nocache");

require("dotenv").config();
const {
  err404,
  err500,
  routeDifferentiator,
} = require("./middleware/errorHandler");
const mongoURI = process.env.mongoURI;
// Connecting with mongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  w: "majority",
});
const crypto = require("crypto");

const express = require("express");
const path = require("path");

const app = express();
const session = require("express-session");
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(nocache());

app.use(express.urlencoded({ extended: true }));

const secretKey = crypto.randomBytes(32).toString("hex");

app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");

app.use(flash());

app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "/public/admin")));
app.use(routeDifferentiator);

// For Admin Route
app.use("/admin", adminRouter);

// For User Route
app.use("/", userRouter);

// Error Handling
app.set("views", "./views/errors");

app.use(err404);
app.use(err500);

app.listen(port, () => {
  console.log(`Server is live at:http://localhost:${port}`);
});

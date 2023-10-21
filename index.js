"use strict";

const express = require("express");
const port = 1337;
const app = express();
const indexRoutes = require("./routes/indexroutes.js");
const session = require('express-session');
const fileUpload = require('express-fileupload');



app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

app.use(fileUpload());

// Configure session middleware
app.use(
    session({
        secret: "sadkasodkaodotad", // Replace with your own secret key
        resave: false,
        saveUninitialized: true,
        //cookie: { secure: false }, // Set 'secure' to true if using HTTPS
    })
);

app.use(indexRoutes);

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});

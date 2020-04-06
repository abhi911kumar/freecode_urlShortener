"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");

var bodyParser = require("body-parser");

var cors = require("cors");

var validator = require("validator");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

//mongoose.connect(process.env.DB_URI);

mongoose.connect("mongodb://localhost:27017/urlShortningDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

var short_url_schema = new mongoose.Schema({
    original_url: {
        type: String,
    },
    short_url: {
        type: String,
    },
});

var short_url_model = mongoose.model("short_url", short_url_schema);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

// for parsing application/json
app.use(express.json());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.post("/api/shorturl/new", async(req, res) => {
    if (validator.isURL(req.body.url)) {
        try {
            const req_short_url = await short_url_model.findOne({
                original_url: req.body.url,
            });

            if (req_short_url) {
                res.json({
                    original_url: req.body.url,
                    short_url: req_short_url.short_url,
                });
            } else {
                var ID = function() {
                    // Math.random should be unique because of its seeding algorithm.
                    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
                    // after the decimal.
                    return "_" + Math.random().toString(36).substr(2, 9);
                };
                const new_short_url = await ID();

                // a document instance
                const newShorteningUrl = new short_url_model({
                    original_url: req.body.url,
                    short_url: new_short_url,
                });

                // save model to database
                await newShorteningUrl.save(function(err) {
                    if (err) return res.json({ error: err });
                    res.json({ original_url: req.body.url, short_url: new_short_url });
                });
            }
        } catch (err) {
            console.log(err);
        }
    } else {
        res.json({ error: "Invalid URL!" });
    }
});

app.get("/api/shorturl/:req_short_url", async(req, res) => {
    const reqshorturl = req.params.req_short_url;

    const short_url = await short_url_model.findOne({ short_url: reqshorturl });

    if (short_url) {
        return res.redirect(short_url.original_url);
    } else {
        res.json({ error: "Invalid URL!" });
    }
});

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
    res.json({ greeting: "hello API" });
});

app.listen(port, function() {
    console.log("Node.js listening ...");
});
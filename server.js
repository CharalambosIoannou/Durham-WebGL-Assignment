"use strict"
var express = require('express')
var bodyParser = require('body-parser');



//const app = require('./app');
var app = express()
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));




app.listen(8090);

module.exports = app;
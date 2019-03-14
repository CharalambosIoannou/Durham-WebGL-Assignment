"use strict"
var express = require('express')

//const app = require('./app');
var app = express()
app.use(express.static('public'));




app.listen(8090);

module.exports = app;
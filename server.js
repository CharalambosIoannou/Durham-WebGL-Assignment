"use strict"
var express = require('express')

//const app = require('./app');
var app = express()
app.use(express.static('public'));

var port = process.env.PORT || 8090;


app.listen(port);

module.exports = app;
console.log("Listening on: 127.0.0.1:8090\n");
console.log("Please type '127.0.0.1:8090/durham.html' to see the assignment");
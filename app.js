/*
* REST API for pushing and pulling resources to GELS D3 solution.
* authentication is used to identify the user
**/
'use-strict';
// Load the SDK and UUID
var AWS = require('aws-sdk');
var express = require('express');
var node_xj = require("xls-to-json");
var exports = module.exports = {};

/**********************************************************************
       AWS S3 SETUP
***********************************************************************/
const bucket = "";
//set local testing credentials (can set as ENV variables later)
if(!process.env.ENV){
  AWS.config.loadFromPath('./local-config.json');
}
// Create an S3 client
var s3 = new AWS.S3({ apiVersion: '2006-03-01' });

/**********************************************************************
       EXPORT & MAIN FUNCTION
***********************************************************************/
module.exports = function(mapper_file, folder){
  node_xj({
    input: mapper_file,  // input xls
    output: "output.json"
  }, function(err, result) {
    if(err) {
      console.error(err);
    } else {
      console.log("output.json created");
      console.log(result[0]);
    }
  });
};

//needs to be at the end
require('make-runnable');

/*
* REST API for pushing and pulling resources to GELS D3 solution.
* authentication is used to identify the user
**/
'use-strict';
// Load the SDK and UUID
var AWS = require('aws-sdk');
var express = require('express');
var node_xj = require("xls-to-json");
var proxy = require('proxy-agent');
var fs = require('fs');
var corpProxy;// = require("./proxy-config");//get proxy

var exports = module.exports = {};
/**********************************************************************
AWS S3 SETUP
***********************************************************************/
const bucket = "";
AWS.config.loadFromPath('./local-config.json');//set local testing credentials
//set corporate proxy within ./proxy-config.json
if(corpProxy){
  AWS.config.update({
    httpOptions: { agent: proxy(corpProxy.proxy) }
  });
}

var s3 = new AWS.S3({ apiVersion: '2006-03-01' });// Create an S3 client

/**********************************************************************
EXPORT & MAIN FUNCTIONS
***********************************************************************/
module.exports = function(folder_path, mapper_file){
  //checks to see if mapper_file has been set for meta data uploads
  //and create a json array of the data to use for parsing metadata
  if(mapper_file){
    node_xj({
      input: mapper_file,  // input xls
      output: "mapper_file.json"
    }, function(err, result) {
      if(err) {
        console.error(err);
      } else {
        console.log("uploading " + result.length + " files to S3 bucket... (Please wait)");
        uploadWithMetaData(result, folder_path);
      }
    });//end mapper input
    //if no meta data file specified do normal upload
  } else {
    uploadFiles(folder_path);
  }//end if else

  //uploading with meta data function
  function uploadWithMetaData(result, folder_path) {
    //loop array for each file in mapper file
    result.forEach(function(item){
      //get a file stream for current file
      file = folder_path + "/" + item["file-name"];
      var fileStream = fs.createReadStream(file);

      //create tag string & params for object
      var tagset = getTagString(item);
      var params = setParams(item, tagset);
      params[Body] = fileStream;
      uploadToS3(params);
    });//end result loop

  }//end upload with meta dta

  // tags can be used for permissions in S3
  // only 10 can be set so make first 10 columns in the excel file the ones you want to tag
  function getTagString(item) {
    var tagset = Array();
    var count = 0; //initiate count for tag loop

    for (var key in item) {
      if (count < 10){ // limited to 10
        tagset.push(key + "=" + item[key].replace(/[&\/\\#,+()$~%'":*?;<>{}]/g,"")); //replace special characters
        count ++;
      };
    }//end for loop

    tagset = tagset.join('&');//join items by & to create querl URL string
    return tagset;
  }

  function setParams(item, tagset, fileStream) {
    //for each create an array for s3 params, set ACL for publis docs
    var params = {
      Bucket: "gelsdocs",
      Key: item["file-name"],
      ACL: 'public-read',
      Tagging: tagset,
      Metadata: item//metadata defined in excel import
    };
  }

  function uploadToS3(params) {
    //set counters and message outputs for process
    var uploadCount = 0;
    var uploadError = 0;
    var consoleMsg = "";
    var logMsg = "";
    fs.writeFile("./log.txt","");

    //upload file to S3 and print results to console & log file
    s3.upload(params, function(err, data){
      if (err) {
        uploadError ++;
        consoleMsg = uploadCount + ' successful uploads, ' + uploadError + ' upload errors. ';
        logMsg = consoleMsg + item["file-name"] + " " + err.message ;
        fs.appendFile("./log.txt", logMsg + "\r\n");
      } else {
        uploadCount ++;
        consoleMsg = uploadCount + ' successful uploads, ' + uploadError + ' upload errors. ';
      }
      console.log(consoleMsg + "(log.txt for more info)");
    });
  }

  //upload without metadata function
  function uploadFiles(folder_path) {
    console.log(folder_path);
    //upload all files by file name
  }

}; //end exports
//needs to be at the end
require('make-runnable');

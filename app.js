/*
* REST API for pushing and pulling resources to GELS D3 solution.
* authentication is used to identify the user
**/
'use-strict';
// Load the SDK and UUID

var express = require('express');
var node_xj = require("xls-to-json");
var proxy = require('proxy-agent');
var fs = require('fs');
const commandLineArgs = require('command-line-args')
var AWS = require('aws-sdk');

var corpProxy = require("./proxy-config");
var credentials = require("./local-config");

// basic set up for an export command line tool
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/*
* set command line options. Allows users to provide options for pushing documents
* path can be local or URL of a folder on a server type is the mapper file type
* i.e. excel or xml (for meta data)
*/
const optionDefinitions = [
  { name: 'path', alias: 'p', type: String },
  { name: 'type', alias: 't', type: String },
  { name: 'help', alias: 'h', type: Boolean}
]
const options = commandLineArgs(optionDefinitions)

/*
* AWS S3 SETUP - configure proxy & credentials. proxy if needed (uncomment for inside GE Network)
*/
AWS.config.update({
  httpOptions: {
    agent: proxy('http://3.28.29.241:88')
  }
});
var creds = new AWS.Credentials({
  accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey, sessionToken: credentials.sessionToken
});
var s3 = new AWS.S3({ apiVersion: '2006-03-01', credentials : creds, signatureVersion: 'v4', region: credentials.region });// Create an S3 client

/*
* USER OPTIONS
* check if path has been set and if mapper exists in the folder
* ensure that a type has been specified
*/
var path, mapper, type;
//display help first if required
if(options.help){
  displayHelp();
} else {
  //use path to get mapper if one exists
  if(options.path){
    path = options.path;
    mapper = findMapperFile(options.path);
  } else {
    console.log("no folder path given, use --help for more info")
  }
  //check if type has been set, if mapper returns a type must be specified
  if(options.type){type = options.type;}
  if(mapper && !type){console.log("no mapper file type given, use --help for more info")}
  //if mapper exists switch on type to change upload process
  if(mapper){
    mapper = path + "\\" + mapper;
    switch(type){
      case 'excel' :
            excelMapper(mapper, path);
            break;
      case 'xml' :
            console.log("xml", path);
            break;
    }
  } else if (path){ uploadFilesOnly(path) } //if no mapper just upload files only
}

/*
* Display Help for commandd line options
*/
function displayHelp() {
  console.log("\nWelcome to the S3 uploader \n");
  console.log("-h, --help       Display user guide");
  console.log("-p, --path       define the folder path of your documents to upload");
  console.log("-t, --type       if a metadata mapping file is found the type needs to be defined i.e. excel, xml");
}

function uploadFilesOnly(path){
  console.log("Files only: " + path);
}

/*
* function used for excel mapper types
*/
function excelMapper(mapper, path) {
  node_xj({
    input: mapper,  // input xls
    output: "mapper_file.json"
  }, function(err, result) {
    if(err) {
      console.error(err);
    } else {
      if(!result[result.length-1]["file-name"]){
        result.splice(result.length-1);
      }
      console.log("uploading " + result.length + " files to S3 bucket... (Please be patient, this may take some time)");
      uploadWithMetaData(result, path);
    }
  });//end mapper input
}

/*
* upload file - for each item in json from xml/excel find file and upload to s3
* with relating metadata
*/
function uploadWithMetaData(result, folder_path) {
  var uploadCount = 0;
  var uploadError = 0;
  var consoleMsg = "";
  var logMsg = "";
  fs.writeFile("./log.txt","");

  //loop array for each file in mapper file
  result.forEach(function(item){
    //get a file stream for current file
    if(item["file-name"]){
      file = folder_path + "/" + item["file-name"];
      var fileStream = fs.createReadStream(file);
      //loop current item and clean data
      for (var i in item){
        item[i] = cleanString(item[i]);
      }
      //create tag string & params for object
      var tagset = getTagString(item);

      //for each create an array for s3 params, set ACL for publis docs
      var params = {
        Bucket: "gels-d3-prod",
        Key: item["file-name"],
        ContentType: "application/pdf",
        ACL: 'public-read',
        Tagging: tagset,
        Body: fileStream,
        Metadata: item//metadata defined in excel import
      };

      //upload file to S3 and print results to console & log file
      s3.upload(params, function(err, data){
        if (err) {
          uploadError ++;
          consoleMsg = uploadCount + ' successful uploads, ' + uploadError + ' upload errors. ';
          logMsg = consoleMsg + item["file-name"] + " " + err ;
          fs.appendFile("./log.txt", logMsg + "\r\n");
        } else {
          uploadCount ++;
          consoleMsg = uploadCount + ' successful uploads, ' + uploadError + ' upload errors. ';
        }
        console.log(consoleMsg + "(log.txt for more info)");
      });//end s3 upload
    }//end if item exists
  });//end result loop
}//end upload with meta data

/*
* GET TAGS - like meta data tags can be used to identify documents
* tags these documents as well
*/
function getTagString(item) {
  var tagset = Array();
  var count = 0; //initiate count for tag loop
  for (var key in item) {
    if (count < 10){ // limited to 10
      tagset.push(key + "=" + item[key]); //replace special characters
      count ++;
    };
  }//end for loop
  tagset = tagset.join('&');//join items by & to create querl URL string
  return tagset;
}

/*
* function to clean up all string's and remove and special characters that
* would cause errors in AWS s3 upload
*/
function cleanString(str) {
    var special = ['&', 'O', 'Z', '-', 'o', 'z', 'Y', 'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï', 'Ð', 'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', 'ð', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', 'ù', 'ú', 'û', 'ü', 'ý', 'ÿ',';',"'",'™'],
        normal = ['et', 'o', 'z', '-', 'o', 'z', 'y', 'a', 'a', 'a', 'a', 'a', 'a', 'ae', 'c', 'e', 'e', 'e', 'e', 'i', 'i', 'i', 'i', 'd', 'n', 'o', 'o', 'o', 'o', 'o', 'u', 'u', 'u', 'u', 'y', 'a', 'a', 'a', 'a', 'a', 'a', 'ae', 'c', 'e', 'e', 'e', 'e', 'i', 'i', 'i', 'i', 'o', 'n', 'o', 'o', 'o', 'o', 'o', 'u', 'u', 'u', 'u', 'y', 'y','','','TM'];
    for (var i = 0; i < str.length; i++) {
        for (var j = 0; j < special.length; j++) {
            if (str[i] == special[j]) {
                str = str.replace(new RegExp(str[i], 'gi'), normal[j]);
            }
        }
    }
    str = str.replace(/[&\/\\#,+()$~%'":*?;<>{}]/g,"");
    return str;
};

/*
* FIND MAPPER FILE - explores folder given to find mapper file based on type, excel or xml
*/
function findMapperFile(startPath) {
  var validExt = /(xlsx|xls)$/ig;
  var result;
  var files = fs.readdirSync(startPath);
  for(i in files){
    var extension = files[i].substr(files.lastIndexOf(".") + 1);
    if(validExt.test(extension)){
      result = files[i];
    }
  }
  return result;
};

# AWS S3 Bulk Upload for Node.js Sample Project

A simple Node.js application illustrating usage of the AWS SDK and using it for bulk upload to an S3 bucket of your choice.

## Requirements

The only requirement of this application is the Node Package Manager. All other
dependencies (including the AWS SDK for Node.js) can be installed with:

    npm install

## Basic Configuration

You need to set up your AWS security credentials before the sample code is able
to connect to AWS. You can do this by updating the local-config.json file. you will need to create an IAM user and S3 bucket to be able to get the following information

    {
      "accessKeyId": "AWS KEY HERE",
      "secretAccessKey": "AWS ACCESS KEY HERE",
      "region": "us-west-2"
    }


See the [Security Credentials](http://aws.amazon.com/security-credentials) page.
It's also possible to configure your credentials via a configuration file or
directly in source. See the AWS SDK for Node.js [Developer Guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html)
for more information.

## Data Mapping & File Setup
Its important to get your data all together in a specific way for bulk upload.

Firstly you will need to place all the files you want to upload into a folder somewhere and grab the location path for it.

Secondly you want to create a mapper_file which will be used to add metadata (if you wish - optional choice) to the files directly on upload.

The second file (mapper_file) is important to get right. you need a field named "file name" (with the space) which will be used to locate the file in the folder and then any other fields you name will be the meta data that the documents are tagged with.

## Running the Bulk upload sample

The S3 bulk upload app pushes files to an S3 bucket along with any metadata requirements you may have. for set up its important to have your mapper file up to scratch. To run the simple app use the following:

    node app.js [folder_path] [mapper_file_path]

The S3 documentation has a good overview of the [AWS S3 documentation](http://docs.aws.amazon.com/AmazonS3/)
for when you start making your own buckets.

## License

This sample application is distributed under the
[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

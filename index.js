var AWS = require('aws-sdk');
var twilio = require('twilio');
var twilio_account_sid = "AC70372898412e2267a2e6bfa8ad8ebd72";

exports.handler= function (event, context) {
    console.log("JSON API from Semaphore: %j", event);

    AWS.config.apiVersions = {
        s3: '2006-03-01'
    }

    var s3 = new AWS.S3({region:'ap-southeast-1'});

    var params = {Bucket: 'mail2smsoriginal', Key: 'numbers.json'};

    s3.getObject(params, function(err,data) {
        if(err) console.log(err, err.stack);

        var numbers = JSON.parse(data.Body);

        manipulateNumbers(numbers);
    });

    function manipulateNumbers(numbers) {
        //if someone breaks the build in semaphore, enter if statement
        if(event.branch_name == 'master' && event.result == "failed") {
            //we get the name of the person who broke the build
            var blame = event.commit.author_name;

            //message for dev who broke the build
            var message = "Congratulations" + blame + " you have broken the app!"
            
            twilioHandler(numbers, message);
        };
    };

    function twilioHandler(numbers, message) {
        var blame_mail = event.commit.author_email;
        //twilio credentials
        var twilio_account_id = numbers.twilio.twilio_account_sid;
        var twilio_auth_token = numbers.twilio.twilio_auth_token;
        var twilio_number = numbers.twilio.twilio_number;

        var client = twilio(twilio_account_sid, twilio_auth_token);

        //send SMS

        client.sendSms({
            to: numbers[blame_mail],
            from: twilio_number,
            body: message 
        }, function (err, responseData) { // this function is executed when a response is received from Twilio
            if(!err){
                console.log(responseData);
                context.done(null, "Message sent to" + numbers[blame_mail] + "!");
            } else {
                console.log(err);
                context.done(null, "There was an error, message not sent.");
            }
        });
    }
};

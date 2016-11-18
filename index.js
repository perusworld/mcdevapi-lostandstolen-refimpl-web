var express = require('express');
var bodyParser = require('body-parser');

var fs = require('fs')
var app = express();
var lostStolen = require('mastercard-lost-stolen');
var MasterCardAPI = lostStolen.MasterCardAPI;

var dummyData = [];
var dummyDataFiles = ['www/data/menu.json', 'www/data/account-number.json'];
dummyDataFiles.forEach(function(file) {
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
            return console.log(err);
        }
        dummyData[file] = JSON.parse(data);
    });
});

var config = {
    p12file: process.env.KEY_FILE || null,
    p12pwd: process.env.KEY_FILE_PWD || 'keystorepassword',
    p12alias: process.env.KEY_FILE_ALIAS || 'keyalias',
    apiKey: process.env.API_KEY || null,
    sandbox: process.env.SANDBOX || 'true',
}

var useDummyData = null == config.p12file;
if (useDummyData) {
    console.log('p12 file info missing, using dummy data')
} else {
    console.log('has p12 file info, using MasterCardAPI')
    var authentication = new MasterCardAPI.OAuth(config.apiKey, config.p12file, config.p12alias, config.p12pwd);
    MasterCardAPI.init({
        sandbox: 'true' === config.sandbox,
        authentication: authentication
    });
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('www'));

app.post('/menu', function(req, res) {
    res.json(dummyData[dummyDataFiles[0]]);
});

app.post('/orders', function(req, res) {
    res.json({});
});

app.post('/confirm', function(req, res) {
    res.json({});
});

app.post('/checkAccountNumber', function(req, res) {
    if (useDummyData) {
        if (null == dummyData[dummyDataFiles[1]][req.body.accountNumber]) {
            res.json(dummyData[dummyDataFiles[1]].default);
        } else {
            res.json(dummyData[dummyDataFiles[1]][req.body.accountNumber]);
        }
    } else {
        var requestData = {
            "AccountInquiry": {
                "AccountNumber": req.body.accountNumber
            }
        };
        lostStolen.AccountInquiry.update(requestData, function(error, data) {
            if (error) {
                res.json({
                    "type": "APIError",
                    "message": "Error executing API call",
                    "status": 400,
                    "data": {
                        "Errors": {
                            "Error": {
                                "Source": "Unknown",
                                "ReasonCode": "UNKNOWN",
                                "Description": "Unknown error",
                                "Recoverable": "false"
                            }
                        }
                    }
                });
            }
            else {
                res.json(data);
            }
        });

    }
});

app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});

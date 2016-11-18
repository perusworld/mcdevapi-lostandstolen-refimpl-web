var fs = require('fs')
var lostStolen = require('mastercard-lost-stolen');
var MasterCardAPI = lostStolen.MasterCardAPI;

var config = {
    p12file: process.env.KEY_FILE || null,
    p12pwd: process.env.KEY_FILE_PWD || 'keystorepassword',
    p12alias: process.env.KEY_FILE_ALIAS || 'keyalias',
    apiKey: process.env.API_KEY || null,
    sandbox: process.env.SANDBOX || 'true',
}

var authentication = new MasterCardAPI.OAuth(config.apiKey, config.p12file, config.p12alias, config.p12pwd);
MasterCardAPI.init({
    sandbox: 'true' === config.sandbox,
    authentication: authentication
});

var writeFile = true;
var accountNumbers = [];

function writeObj(obj, file, callback) {
    if (writeFile) {
        fs.writeFile("www/data/" + file, JSON.stringify(obj), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
            callback();
        });
    } else {
        console.log("skipping file save!");
        callback();
    }
}

function dumpAccountNumber(accountNumber, response, callback) {
    var requestData = {
        "AccountInquiry": {
            "AccountNumber": accountNumber
        }
    };
    lostStolen.AccountInquiry.update(requestData,
        function (error, data) {
            if (error) {
                response[accountNumber] = error;
            }
            else {
                response[accountNumber] = data;
            }
            callback(response);
        });
}
function dumpAccountNumbers(response) {
    if (0 < accountNumbers.length) {
        dumpAccountNumber(accountNumbers.shift(), response, dumpAccountNumbers);
    } else {
        response.default = response["343434343434343"];
        response.defaultError = response["510510510510510A"];
        console.dir(response, { depth: null });
        writeObj(response, "account-number.json", function () {
            console.log('done');
        });

    }
}


accountNumbers = [
    "5105105105105100",
    "5222222222222200",
    "5305305305305300",
    "5343434343434343",
    "6011111111111117",
    "4444333322221111",
    "343434343434343",
    "510510510",
    "510510510510510A",
    "5151515151515151"
];
//writeFile = false;
dumpAccountNumbers({});

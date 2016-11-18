# Mastercard Developer API - Lost and Stolen Account List - Reference Implementation - Angular/Express #

## [Demo](https://perusworld.github.io/mcdevapi-lostandstolen-refimpl-web/) ##

## Setup ##

1.Checkout the code
```bash
git clone https://github.com/perusworld/mcdevapi-lostandstolen-refimpl-web.git
```
2.Run bower install
```bash
bower install
```
3.Run npm install
```bash
npm install
```

## Running using dummy data ##
1.Start the app
```bash
node index.js
```
2.Open browser and goto [http://localhost:3000](http://localhost:3000)

## Running using MasterCard API ##
Make sure you have registered and obtained the API keys and p12 files from [https://developer.mastercard.com/](https://developer.mastercard.com/)

1.Start the app
```bash
export KEY_FILE=<your p12 file location>
export API_KEY=<your api key>
node index.js
```
2.Open browser and goto [http://localhost:3000](http://localhost:3000)

#### Some of the other options ####
```bash
export KEY_FILE_PWD=<p12 key password defaults to keystorepassword>
export KEY_FILE_ALIAS=<p12 key alias defaults to keyalias>
export SANDBOX=<sandbox or not defaults to true>
```
## Code ##
### Backend API Initialization ###
```javascript
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
```
### Backend API Call (query status of an account number) ###
```javascript
app.post('/checkAccountNumber', function(req, res) {
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
});
```
### Angular Service to Lost and Found ###
```javascript
angular.module('lostfound.api', [])

    .service('LostAndFoundApi', ['$http', function($http) {
        var ret = {
            checkAccountNumber: function(req, callback) {
                $http.post('/checkAccountNumber', req).then(function successCallback(response) {
                    callback(response.data)
                });
            }
        };
        return ret;
    }])

    .factory('LostAndFoundService', function(LostAndFoundApi, Session) {
        var ret = {
            checkAccountNumber: function(req, callback) {
                LostAndFoundApi.checkAccountNumber(req, function(data) {
                    if (null != data.Account) {
                        if (data.Account.Listed) {
                            callback({
                                response: data.Account,
                                reason: data.Account.Reason,
                                status: false
                            });
                        } else {
                            callback({
                                status: true
                            });
                        }
                    } else if (null != data.data) {
                        callback({
                            response: data.data.Errors.Error,
                            reason: data.data.Errors.Error.Description,
                            status: false
                        });
                    } else {
                        callback({
                            response: {},
                            reason: "UNKNOWN",
                            status: false
                        });
                    }
                });
            }
        };
        return ret;
    });
```
### Angular Controller to validate account number ###
```javascript
    .controller('ValidateCtrl', ['$scope', '$state', '$ionicLoading', '$ionicPopup', 'LostAndFoundService', function ($scope, $state, $ionicLoading, $ionicPopup, LostAndFoundService) {

        $scope.payment = {
            accountNumber: ""
        };

        $scope.showAlert = function (title, msg) {
            var alertPopup = $ionicPopup.alert({
                title: title,
                template: msg
            });
            alertPopup.then(function (res) {
            });
        };


        $scope.doValidate = function (accountNumber) {
            $ionicLoading.show({
                template: 'Processing, Please wait...'
            }).then(function () {
                LostAndFoundService.checkAccountNumber({
                    accountNumber: accountNumber
                }, function (response) {
                    if (response.status) {
                        $ionicLoading.hide().then(function () {
                            //continue to payment confirmation
                        });
                    } else {
                        $ionicLoading.hide().then(function () {
                            $scope.showAlert("Invalid account number", response.reason);
                        });
                    }
                });
            });
        };

    }]);
```
### Angular Template to validate account number ###
```html
        <form class="list">
            <ion-list>
                <label class="item item-input">
                    <span class="input-label">Card</span>
                    <input type="text" ng-model="payment.accountNumber" placeholder="xxxx-xxxx-xxxx-xxxx">
                </label>
            </ion-list>
            <a ng-click="doValidate(payment.accountNumber)" class="button button-stable button-block button-positive icon ion-ios-pricetags"> Validate</a>
        </form>
```

## Images Courtesy ##
[Sharon Ang](https://pixabay.com/en/users/sharonang-99559/)
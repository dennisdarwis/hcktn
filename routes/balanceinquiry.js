const ResponseCode = require("../constants/responseCode");
const ResponseMessage = require("../constants/responseMessage");
var express = require('express'),
    bodyParser = require('body-parser');

var request = require('request');
var needle = require('needle');

const querystring = require('querystring');   
const https = require('https');

const pg = require('pg');

require('body-parser-xml')(bodyParser);

var app = require('express').Router();
app.use(bodyParser.xml({
  limit: '1MB',   // Reject payload bigger than 1 MB
  xmlParseOptions: {
    normalize: true,     // Trim whitespace inside text nodes
    normalizeTags: true, // Transform tags to lowercase
    explicitArray: false // Only put nodes in array if >1
  }
}));

const CONNECTIONSTRING ='postgres://localhost:5432/hackathon';
const BALANCE_TRANSFER = "Balance Transfer";

// .. other middleware ... 
// ... other middleware ... 


module.exports = (function () {
    app.post('/fundtransfer', function(req, res, next) {
        console.log("result: ", req.body);
        //console.log("test: ",req.body.fundtransferrequest.messageid);
        result = {};
        data = {
            messageid : req.body.fundtransferrequest.messageid,
            fromaccount : req.body.fundtransferrequest.fromaccount,
            toaccount : req.body.fundtransferrequest.toaccount,
            toaccountname : req.body.fundtransferrequest.toaccountname,
            tobsb : req.body.fundtransferrequest.tobsb,
            txnamount : req.body.fundtransferrequest.txnamount
        }
        //https.post

        console.log(data.messageid);
        //testNeedle();
        if(data.messageid && data.fromaccount && data.toaccount && data.toaccountname && data.tobsb
             && data.txnamount){
                 console.log("true");
                 checkAccountNumber();
                 //testNeedle();
                 //testHTTPGET();
                 //return res.json(result);
        } else{
            console.log("false");
            error800();
        }

        function testNeedle(){
            console.log("NEEDLE CALL");
            /*needle.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', function(err, resp) {
                // if no http:// is found, Needle will automagically prepend it.
                console.log("RESPONSE!!!!!!: ",resp.body);
            });*/
            needle.post('dugempublic.ap-southeast-2.elasticbeanstalk.com/browse/events/',
            {
                "lat": -37.8465580,
                "long": 144.9775550
            }
            , function(err, resp) {
                // if no http:// is found, Needle will automagically prepend it.
                console.log("RESPONSE!!!!!!: ",resp.body, resp.params);
            });
        }

        function checkAccountNumber(){
            if(data.fromaccount!=0 && data.fromaccount.toString().length == 16
             && data.toaccount!=0 && data.toaccount.toString().length == 16){
                console.log("accountNumber true");
                checkBSB();
             } else{
                console.log("false");
                error800();
             }
        }

        function checkBSB(){
            if(data.tobsb.toString().length==6){
                checkMssgId();
            } else{
                error898();
            }
        }

        function checkMssgId(){
            pg.connect(CONNECTIONSTRING, function(err, client, done) {
                if (err) {
                    return console.error('error fetching client from pool', err);
                }
                console.log("connected to database");
                client.query("SELECT mssgid FROM transaction_audit WHERE mssgid=($1)", [data.messageid], function(err, row) {
                    done();
                    if(err) {
                        result = {responseCode: ResponseCode.MESSAGE_FORMAT_ERROR};
                        return res.json(result);
                    } else{
                        if(row.rows.length>0){
                            error333();
                            console.log("MssgId duplicate meh");
                        } else{
                            getAccountDetails();
                            console.log("MssgId unique");
                        }
                    }
                    //return res.json(result);
                });
            });
        }

        function getAccountDetails(){
            pg.connect(CONNECTIONSTRING, function(err, client, done) {
                if (err) {
                    return console.error('error fetching client from pool', err);
                }
                console.log("connected to database");
                /*client.query("SELECT * FROM account WHERE accnum=($1)", [data.fromaccount], function(err, row) {
                    done();
                    if(err) {
                        result = {responseCode: ResponseCode.MESSAGE_FORMAT_ERROR};
                        return res.json(result);
                    } else{
                        if(row.rows.length>0){
                            checkBalance(row.rows[0]);
                            console.log("account found");
                        } else{
                            error899();
                            console.log("account not found");
                        }
                    }
                    //return res.json(result);
                });*/
                client.query("SELECT * FROM account WHERE accnum=($1) OR accnum=($2)", [data.fromaccount, data.toaccount], function(err, row) {
                    done();
                    if(err) {
                        result = {responseCode: ResponseCode.MESSAGE_FORMAT_ERROR};
                        return res.json(result);
                    } else{
                        if(row.rows.length==2){
                            for(var i in row.rows){
                                console.log("hoho: ",row.rows[i]);
                                if(row.rows[i].accnum==data.fromaccount){
                                    console.log("yes: ",row.rows[i]);
                                    checkBalance(row.rows[i]);
                                }
                            }
                            //checkBalance(row.rows[0]);
                            console.log("account found");
                        } else{
                            error899();
                            console.log("account not found");
                        }
                    }
                    //return res.json(result);
                });
            });
        }

        function checkBalance(accountData){
            console.log("accountData: ",accountData);
            if(accountData.balance >= data.txnamount){
                console.log("approved");
                approved000();
            } else{
                console.log("insufficient funds");
                error121();
            }
        }

        function approved000(){
            pg.connect(CONNECTIONSTRING, function(err, client, done) {
                if (err) {
                    return console.error('error fetching client from pool', err);
                }
                console.log("connected to database");
                client.query("INSERT INTO transaction_audit(mssgid, imessage, status, reasoncodes) values($1,$2,$3,$4)", [data.messageid, BALANCE_TRANSFER, "Success", ResponseCode.APPROVED], function(err, row) {
                    done();
                    if(err) {
                        result = {responseCode: ResponseCode.MESSAGE_FORMAT_ERROR};
                        return res.json(result);
                    } else{
                        result.statusCode = ResponseCode.APPROVED;
                        result.msgId = data.messageid;
                        return res.json(result);
                    }
                    //return res.json(result);
                });
            });
        }

        function error898(){
            pg.connect(CONNECTIONSTRING, function(err, client, done) {
                if (err) {
                    return console.error('error fetching client from pool', err);
                }
                console.log("connected to database");
                client.query("INSERT INTO transaction_audit(mssgid, imessage, status, reasoncodes) values($1,$2,$3,$4)", [data.messageid, BALANCE_TRANSFER, "Failure", ResponseCode.INVALID_BSB], function(err, row) {
                    done();
                    if(err) {
                        result = {responseCode: ResponseCode.MESSAGE_FORMAT_ERROR};
                        return res.json(result);
                    } else{
                        result.statusCode = ResponseCode.INVALID_BSB;
                        result.failureReason = ResponseMessage.INVALID_BSB;
                        return res.json(result);
                    }
                    //return res.json(result);
                });
            });
        }

        function error121(){
            pg.connect(CONNECTIONSTRING, function(err, client, done) {
                if (err) {
                    return console.error('error fetching client from pool', err);
                }
                console.log("connected to database");
                client.query("INSERT INTO transaction_audit(mssgid, imessage, status, reasoncodes) values($1,$2,$3,$4)", [data.messageid, BALANCE_TRANSFER, "Failure", ResponseCode.INSUFFICIENT_FUNDS], function(err, row) {
                    done();
                    if(err) {
                        result = {responseCode: ResponseCode.MESSAGE_FORMAT_ERROR};
                        return res.json(result);
                    } else{
                        result.statusCode = ResponseCode.INSUFFICIENT_FUNDS;
                        result.failureReason = ResponseMessage.INSUFFICIENT_FUNDS;
                        return res.json(result);
                    }
                    //return res.json(result);
                });
            });
        }

        function error899(){
            pg.connect(CONNECTIONSTRING, function(err, client, done) {
                if (err) {
                    return console.error('error fetching client from pool', err);
                }
                console.log("connected to database");
                client.query("INSERT INTO transaction_audit(mssgid, imessage, status, reasoncodes) values($1,$2,$3,$4)", [data.messageid, BALANCE_TRANSFER, "Failure", ResponseCode.INVALID_ACCOUNT_NUMBER], function(err, row) {
                    done();
                    if(err) {
                        result = {responseCode: ResponseCode.MESSAGE_FORMAT_ERROR};
                        return res.json(result);
                    } else{
                        result.statusCode = ResponseCode.INVALID_ACCOUNT_NUMBER;
                        result.failureReason = ResponseMessage.INVALID_ACCOUNT_NUMBER;
                        return res.json(result);
                    }
                    //return res.json(result);
                });
            });
        }

        function error800(){
            pg.connect(CONNECTIONSTRING, function(err, client, done) {
                if (err) {
                    return console.error('error fetching client from pool', err);
                }
                console.log("connected to database");
                client.query("INSERT INTO transaction_audit(mssgid, imessage, status, reasoncodes) values($1,$2,$3,$4)", [data.messageid, BALANCE_TRANSFER, "Failure", ResponseCode.MESSAGE_FORMAT_ERROR], function(err, row) {
                    done();
                    if(err) {
                        result = {responseCode: ResponseCode.MESSAGE_FORMAT_ERROR};
                        return res.json(result);
                    } else{
                        result.statusCode = ResponseCode.MESSAGE_FORMAT_ERROR;
                        result.failureReason = ResponseMessage.MESSAGE_FORMAT_ERROR;
                        return res.json(result);
                    }
                    //return res.json(result);
                });
            });
        }

        function error333(){
            pg.connect(CONNECTIONSTRING, function(err, client, done) {
                if (err) {
                    return console.error('error fetching client from pool', err);
                }
                console.log("connected to database");
                client.query("INSERT INTO transaction_audit(mssgid, imessage, status, reasoncodes) values($1,$2,$3,$4)", [data.messageid, BALANCE_TRANSFER, "Failure", ResponseCode.DUPLICATE_MESSAGE], function(err, row) {
                    done();
                    if(err) {
                        result = {responseCode: ResponseCode.MESSAGE_FORMAT_ERROR};
                        return res.json(result);
                    } else{
                        result.statusCode = ResponseCode.DUPLICATE_MESSAGE;
                        result.failureReason = ResponseMessage.DUPLICATE_MESSAGE;
                        return res.json(result);
                    }
                    //return res.json(result);
                });
            });
        }

        function testHTTPGET(){
            var headers = {
                'Content-Type':     'application/json'
            }

            // Configure the request
            var options = {
                url: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY',
                method: 'GET',
                headers: headers
            }

            // Start the request
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    // Print out the response body
                    console.log(body)
                    return res.json(JSON.parse(body));
                }
            })
        }

        function testHTTPPOST(){
            var http = new XMLHttpRequest();
            var url = 'dugempublic.ap-southeast-2.elasticbeanstalk.com/browse/events/';
            var params = JSON.stringify({
                lat: -37.8465580,
                long: 144.9775550
            });
            
            http.open('POST', url, true);

            //Send the proper header information along with the request
            http.setRequestHeader('Content-type', 'application/json');

            http.onreadystatechange = function() {//Call a function when the state changes.
                if(http.readyState == 4 && http.status == 200) {
                    console.log(http.responseText);
                }
            }
            http.send(params);
        }
    });

    return app;
})();
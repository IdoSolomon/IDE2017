var express = require('express'); // Loading the express module to the server.
var bodyParser = require('body-parser')
var cors = require('cors');
var sql = require('./sql_interface');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var moment = require('moment');
var squel = require("squel");

var conversionRate = 3.7;

var app = express(); // activating express
//var Connection = require('tedious').Connection;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.listen(3100); // server is open and listening on port 3100, to access: localhost:3100 in any browser.

var config = {
    userName: 'hw3admin',
    password: 'dasBeer2',
    server: 'ide-hw3-server.database.windows.net', // update me
    options: {
        encrypt: true,
        rowCollectionOnDone: true,
        database: 'IDE_HW3_DB' //db name
    }
}

var connection = new Connection(config);

connection.on('connect', function (err) {
    if (err) {
        console.log(err)
    }
    app.get('/', function (req, res) {

        res.send("Connected to DB.");
    });

    app.get('/GetCountryList', function (req, res) {



        buildGetCountriesQuerry(req)
            .then(function (query) {
                sql.Select(connection, query)
                    .then(function (ans) {
                        res.send(ans);
                    }
                    )

            })

    });

    app.get('/GetHottest5', function (req, res) {


        buildGetGetHottest5Querry(req)
            .then(function (query) {
                sql.Select(connection, query)
                    .then(function (ans) {
                        res.send(ans);
                    }
                    )

            })


    });

    app.get('/GetNewProducts', function (req, res) {
        buildGetNewProductsQuerry(req)
            .then(function (query) {
                sql.Select(connection, query)
                    .then(function (ans) {
                        res.send(ans);
                    }
                    )

            })

    });

    app.get('/GetConversionRate', function (req, res) {
        var ans = [];
        ans.push(conversionRate);
        res.send(ans);

    });

    app.post('/Register', function (req, res) {
        CheckIfUniqueUserName(req)
            .then(function (reason) {
                if (reason) {
                    UpdateNewUserInUsersTable(req)
                        .then(function (reason) {
                            if (reason) {
                                UpdateSecurityQuestion(req)
                                    .then(function (reason) {
                                        if (reason) {
                                            var myObj = { "Succeeded": true, "Details": "Registration succeeded!" };
                                            res.send(myObj);
                                        }
                                    })
                                    .catch(function (reason) {
                                        var myObj = { "Succeeded": false, "Details": reason };
                                        res.send(myObj);
                                    })
                            }
                        })
                        .catch(function (reason) {
                            var myObj = { "Succeeded": false, "Details": reason };
                            res.send(myObj);
                        })
                }
            })
            .catch(function (reason) {
                res.send({ "Succeeded": false, "Details": reason });
            })



    })



    app.post('/IsUniqueUsername', function (req, res) {
        var name = req.body.Username;
        var query = (
            squel.select()
                .from("Users")
                .field("Username")
                .where("Username = ?", req.body.Username)
                .toString()
        );

        sql.Select(connection, query, function (ans) {
            var verdict = [];
            if (ans.length > 0)
                verdict.push(false);
            else
                verdict.push(true);
            res.send(verdict);
        });
    });

    app.post('/ForgotPassword', function (req, res) {

        var query = (
            squel.select()
                .from("Questions")
                .field("Question")
                .where("Username = ?", req.body.Username)
                .toString()
        );

        sql.Select(connection, query, function (ans) { res.send(ans); });

    });

    app.post('/ValidateAnswer', function (req, res) {

        var query = (
            squel.select()
                .from("Questions")
                .field("Answer")
                .where("Username = ?", req.body.Username)//get username from stored value clientside
                .where("Question = ?", req.body.Question)//get answer from stored value clientside
                .where("Answer = ?", req.body.Answer)
                .toString()
        );

        sql.Select(connection, query, function (ans) {
            var verdict = [];
            if (ans.length > 0)
                verdict.push(false);
            else
                verdict.push(true);
            res.send(verdict);
        });

    });

    app.post('/GetLastLoginTime', function (req, res) {

        //TODO
        //if (!req.query.token) {
        //    res.redirect("http://your.domain/login");
        //    return;
        //}

    });

    app.post('/GetRecommended', function (req, res) {

        //TODO

    });

    app.post('/Search', function (req, res) {

        //TODO

    });

    app.post('/GetItemDetails', function (req, res) {

        //TODO

    });

    app.post('/GetPastOrders', function (req, res) {

        //TODO

    });

    app.post('/MakeOrder', function (req, res) {

        //TODO

    });

    app.post('/IsInStock', function (req, res) {

        //TODO

    });


    let buildGetCountriesQuerry = function (req) {
        return new Promise(
            function (resolve, reject) {
                var query = (
                    squel.select()
                        .from("Countries")
                        .field("Name")
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );

    }

    let buildGetGetHottest5Querry = function (req) {
        return new Promise(
            function (resolve, reject) {
                var currentDate = moment().format('YYYY-MM-DD');
                var query = " SELECT  [Name], [AlcoholPercentage], [Price], [Volume] " +
                    "FROM [dbo].[Beers] " +
                    "WHERE[CategoryID] IN (" +
                    "SELECT TOP 5 [ID] FROM [dbo].[Beers] " +
                    "LEFT JOIN [dbo].[Orders] ON [Beers].ID=[Orders].BeerID " +
                    "LEFT JOIN [dbo].[User-Orders] ON [Orders].OrderID=[User-Orders].OrderID " +
                    "WHERE DATEDIFF(day ,[User-Orders].[OrderDate] ,{0}) <= 5 ".replace('{0}', currentDate) +
                    "GROUP BY [Beers].ID " +
                    "ORDER BY Count(*) );"

                console.log("Query is: " + query)
                resolve(query)
            }
        );


    }


    let buildGetNewProductsQuerry = function (req) {
        return new Promise(
            function (resolve, reject) {
                var currentDate = moment().format('YYYY-MM-DD');
                var query = (
                    squel.select()
                        .from("Beers")
                        .field("LTRIM(RTRIM(Name)) AS [Beer Name],AlcoholPercentage,Price,Volume")
                        .where("DATEDIFF(day ,[Beers].[AddedOn] ,{0}) <= 30".replace('{0}', currentDate))
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );


    }
    let CheckIfUniqueUserName = function (req) {
        console.log("build new promise")

        return new Promise(
            function (resolve, reject) {
                var name = req.body.Username.toString();
                var query = (
                    squel.select()
                        .from("[dbo].[Users]")
                        .field("[Users].[Username]")
                        .where("[Users].[Username] = " + "'" + name + "'")
                        .toString()
                );
                console.log(query)
                sql.Select(connection, query).then(
                    function (ans) {
                        if (ans.length == 0)
                            resolve(true)
                        else
                            resolve(false);
                    })
            }
        )

    }


    let UpdateNewUserInUsersTable = function (req) {
        console.log("build new promise")

        return new Promise(
            function (resolve, reject) {
                var name = req.body.Username;
                var pass = req.body.Password;
                var country = req.body.CountryID;
                var query = (
                    squel.insert()
                        .into("Users")
                        .set("Username", name)
                        .set("Password", pass)
                        .set("CountryID", country)
                        .toString()
                );

                sql.Insert(connection, query)
                    .then(function (succeeded) {
                        resolve(true)
                    })
                    .catch(
                    function (ans) {
                        reject(ans);
                    })

            });
    }

    let UpdateSecurityQuestion = function (req) {
        return new Promise(
            function (resolve, reject) {

                generateSecurityQuestionQuery(req)
                    .then(function (query) {
                        console.log(query)
                        sql.Insert(connection, query)
                            .then(function (succeeded) {
                                resolve(succeeded);
                            })
                            .catch(function (ans) {
                                reject(ans)
                            })
                    })

            });

    }

    let generateSecurityQuestionQuery = function (req) {
        return new Promise(
            function (resolve, reject) {
                questions = req.body.SecurityQuestions;
                var query = "INSERT INTO [Questions] (Username, Question, Answer ) VALUES ";
                for (i = 0; i < questions.length; i++) {
                    if (i > 0) {
                        query += ",";
                    }
                    query += "('" + req.body.Username + "\', \'" + questions[i].Question + "\', \'" + questions[i].Answer + "\')";
                    if (i == questions.length - 1) {
                        resolve(query);
                    }
                }
            });
    }
});

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
                    })

            })

    });

    app.get('/GetConversionRate', function (req, res) {
        var ans = [];
        ans.push(conversionRate);
        res.send(ans);

    });

    app.post('/Register', function (req, res) {
        registerUser(req)
            .then(function (succeded, errMsg) {
                res.send({ "Succeeded": true, "Message": "Registration cmpleted successfuly!" })
            })
            .catch(function (succeded, errMsg) {
                res.send({ "Succeeded": false, "Message": errMsg })

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
                .where("Username = {0}".replace('{0}', req.body.Username))//get username from stored value clientside
                .where("Question = {0}".replace('{0}', req.body.Question))//get answer from stored value clientside
                .where("Answer = {0}".replace('{0}', req.body.Answer))
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

        buildGetRecommendedQuery(req)
            .then(function (query) {
                sql.Select(connection, query)
                    .then(function (ans) {
                        res.send(ans);
                    })
            })

    });

    app.post('/Search', function (req, res) {

        buildSearchQuery(req)
            .then(function (query) {
                sql.Select(connection, query)
                    .then(function (ans) {
                        res.send(ans);
                    })
            })

    });

    app.post('/GetItemDetails', function (req, res) {

        buildGetItemDetailsQuery(req)
            .then(function (query) {
                sql.Select(connection, query)
                    .then(function (ans) {
                        res.send(ans);
                    })
            })

    });

    app.post('/GetPastOrders', function (req, res) {

        buildGetPastOrdersQuery(req)
            .then(function (query) {
                sql.Select(connection, query)
                    .then(function (ans) {
                        res.send(ans);
                    })
            })

    });

    app.post('/MakeOrder', function (req, res) {

        //TODO

    });

    app.post('/IsInStock', function (req, res) {

        buildIsInStockQuery(req)
            .then(function (query) {
                sql.Select(connection, query)
                    .then(function (ans) {
                        var verdict = [];
                        if (ans.length > 0)
                            verdict.push(true);
                        else
                            verdict.push(false);
                        res.send(verdict);
                    })

            })

    });

    let buildGetOrderSumQuery = function (req) {
        return new Promise(
            function (resolve, reject) {
                var query = (
                    squel.select()
                        .field()
                        .from()
                        .where()
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildGetRecommendedQuery = function (req) {
        return new Promise(
            function (resolve, reject) {
                var query = (
                    squel.select()
                        .field("[ID]")
                        .field("[CategoryID]")
                        .field("[Name]")
                        .field("[AlcoholPercentage]")
                        .field("[Price]")
                        .field("[Volume]")
                        .field("[AddedOn]")
                        .from("[dbo].[Beers]")
                        .where("[CategoryID] IN (" + squel.select()
                            .field("[CategoryID]")
                            .from("[dbo].[User-Categories]")
                            .where("[Username] = '{0}'".replace("{0}", req.body.Username))
                            .toString()
                             + ")")
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildGetPastOrdersQuery = function (req) {
        return new Promise(
            function (resolve, reject) {
                var query = (
                    squel.select()
                        .field("[dbo].[User-Orders].[OrderID]")
                        .field("[dbo].[User-Orders].[OrderDate]")
                        .field("[dbo].[User-Orders].[ShippingDate]")
                        .field("[dbo].[User-Orders].[Total]")
                        .field("[dbo].[Beers].[Name]")
                        .field("[dbo].[Beers].[AlcoholPercentage]")
                        .field("[dbo].[Beers].[Price]")
                        .field("[dbo].[Beers].[Volume]")
                        .field("[dbo].[Orders].[Quantity]")
                        .from("[dbo].[User-Orders]")
                        .left_join("[dbo].[Orders]", null, "[dbo].[User-Orders].[OrderID] =  [dbo].[Orders].[OrderID]")
                        .left_join("[dbo].[Beers]", null, "[dbo].[Orders].[BeerID] =  [dbo].[Beers].[ID]")
                        .where("[dbo].[User-Orders].[Username] = '{0}'".replace("{0}", req.body.Username))
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildSearchQuery = function (req) {
        return new Promise(
            function (resolve, reject) {
                var strWhere = "";
                if (req.body.BeerName != "") {
                    strWhere += "[dbo].[Beers].[Name] = '{0}'".replace('{0}', req.body.BeerName);
                }
                if (req.body.CategoryID != "") {
                    if (strWhere != "")
                        strWhere += " AND ";
                    strWhere += "[dbo].[Beers].[CategoryID] = '{0}'".replace('{0}', req.body.CategoryID);
                }
                if (req.body.AlcoholPercentage != "") {
                    if (strWhere != "")
                        strWhere += " AND ";
                    strWhere += "[dbo].[Beers].[AlcoholPercentage] = '{0}'".replace('{0}', req.body.AlcoholPercentage);
                }
                if (req.body.Price != "") {
                    if (strWhere != "")
                        strWhere += " AND ";
                    strWhere += "[dbo].[Beers].[Price] = '{0}'".replace('{0}', req.body.Price);
                }
                if (req.body.Volume != "") {
                    if (strWhere != "")
                        strWhere += " AND ";
                    strWhere += "[dbo].[Beers].[Volume] = '{0}'".replace('{0}', req.body.Volume);
                }
                var query = (
                    squel.select()
                        .field("[dbo].[Beers].[Name]", "BeerName")
                        .field("[dbo].[Categories].[Name]", "CategoryName")
                        .field("[AlcoholPercentage]")
                        .field("[Price]")
                        .field("[Volume]")
                        .field("[AddedOn]")
                        .from("[dbo].[Beers]")
                        .left_join("[dbo].[Categories]", null, "[dbo].[Beers].[CategoryID] = [dbo].[Categories].[ID]")
                        .where(strWhere)
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildGetItemDetailsQuery = function (req) {
        return new Promise(
            function (resolve, reject) {
                var query = (
                    squel.select()
                        .field("[dbo].[Beers].[Name]", "BeerName")
                        .field("[dbo].[Categories].[Name]", "CategoryName")
                        .field("[AlcoholPercentage]")
                        .field("[Price]")
                        .field("[Volume]")
                        .field("[AddedOn]")
                        .from("[dbo].[Beers]")
                        .left_join("[dbo].[Categories]", null, "[dbo].[Beers].[CategoryID] = [dbo].[Categories].[ID]")
                        .where("[dbo].[Beers].[ID] = {0}".replace('{0}', req.body.BeerID))
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildIsInStockQuery = function (req) {
        return new Promise(
            function (resolve, reject) {
                var query = (
                    squel.select()
                        .from("[dbo].[Stock]")
                        .where("[dbo].[Stock].[BeerID] = {0}  AND [dbo].[Stock].[Stock] > 0".replace('{0}', req.body.BeerID))
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

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
    let isUniqueUSerName = function (req) {
        return new Promise(
            function (resolve, reject) {
                var name = req.body.Username;
                var query = (
                    squel.select()
                        .from("Users")
                        .field("Username")
                        .where("Username = {0}".replace("{0}", req.body.Username))
                        .toString()

                );
                sql.Select(connection, query).then(
                    function (ans) {
                        if (ans.length == 0) {
                            regeisterUser(req).then(function (succeeded, errMSg) {
                                if (succeeded == true)
                                    resolve(true, "")
                                else
                                    reject(false, errMSg)
                            })
                        }
                        else
                            reject(false, "User name already exists")

                    }
                )

            }
        );
    }

    let registerUser = function (req) {
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
        sql.Insert(connection, query).then(
            function (ans) {
                resolve(true, "")
            })
            .catch(
            function (ans) {
                resolve(false, "Could not access DB")


            })

    }

});

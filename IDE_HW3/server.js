var express = require('express'); // Loading the express module to the server.
var bodyParser = require('body-parser')
var cors = require('cors');
var sql = require('./sql_interface');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var moment = require('moment');
var squel = require("squel");
var Cookies = require('js-cookie');
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

connection.on('connect', function(err) {
    if (err) {
        console.log(err)
    }
    app.get('/', function(req, res) {

        res.send("Connected to DB.");
    });

    app.post('/Login', function(req, res) {
        validateLoginDetails(req)
            .then(function(loginSucceeded) {
                Cookies.set('name', 'value', { expires: 7 });
                res.send("Great Success");
            })
            .catch(function(reason) {
                res.send(reason);
            })

    })



    app.get('/GetCountryList', function(req, res) {
        buildGetCountriesQuerry(req)
            .then(function(query) {
                sql.Select(connection, query)
                    .then(function(ans) {
                        res.send(ans);
                    }
                    )

            })
    });

    app.get('/GetHottest5', function(req, res) {

        var x = Cookies.get('name'); // => 'value' 


        buildGetGetHottest5Querry(req)
            .then(function(query) {
                sql.Select(connection, query)
                    .then(function(ans) {
                        res.send(ans);
                    }
                    )

            })
    });

    app.get('/GetNewProducts', function(req, res) {
        buildGetNewProductsQuerry(req)
            .then(function(query) {
                sql.Select(connection, query)
                    .then(function(ans) {
                        res.send(ans);
                    })

            })

    });

    app.get('/GetConversionRate', function(req, res) {
        var ans = [];
        ans.push(conversionRate);
        res.send(ans);

    });

    app.post('/Register', function(req, res) {
        CheckIfUniqueUserName(req)
            .then(function(reason) {
                if (reason) {
                    UpdateNewUserInUsersTable(req)
                        .then(function(reason) {
                            if (reason) {
                                UpdateSecurityQuestion(req)
                                    .then(function(reason) {
                                        if (reason) {
                                            UpdateUserCategories(req)
                                                .then(function(reason) {
                                                    if (reason) {
                                                        var myObj = { "Succeeded": true, "Details": "Registration succeeded!" };
                                                        res.send(myObj);
                                                    }
                                                })
                                                .catch(function(reason) {
                                                    var myObj = { "Succeeded": false, "Details": reason };
                                                    res.send(myObj);
                                                })
                                        }
                                    })
                                    .catch(function(reason) {
                                        var myObj = { "Succeeded": false, "Details": reason };
                                        res.send(myObj);
                                    })
                            }
                        })
                        .catch(function(reason) {
                            var myObj = { "Succeeded": false, "Details": reason };
                            res.send(myObj);
                        })
                }
            })
            .catch(function(reason) {
                res.send({ "Succeeded": false, "Details": reason });
            })



    })



    app.post('/IsUniqueUsername', function(req, res) {
        CheckIfUniqueUserName(req)
            .then(function(reason) {
                if (reason) {
                    var myObj = { "Succeeded": true, "Details": "Registration succeeded!" };
                    res.send(myObj);
                }
            })
            .catch(function(reason) {
                res.send({ "Ans": false, "Details": reason });
            })
    });

    app.post('/ForgotPassword', function(req, res) {

        var query = (
            squel.select()
                .from("Questions")
                .field("Question")
                .where("Username = ?", req.body.Username)
                .toString()
        );

        sql.Select(connection, query)
            .then(function(ans) {
                res.send(ans);
            })
            .catch(function(ans) {
                res.send(ans);
            })

    });

    app.post('/ValidateAnswer', function(req, res) {

        var query = (
            squel.select()
                .from("[Users]")
                .left_join("[dbo].[Questions]", null, "[dbo].[Users].[Username] =  [dbo].[Questions].[Username]")
                .field("Password")
                .where("[Users].[Username] = \'{0}\'".replace('{0}', req.body.Username).replace(' ', ''))//get username from stored value clientside
                .where("Question = \'{0}\'".replace('{0}', req.body.Question).replace(' ', ''))//get answer from stored value clientside
                .where("Answer = \'{0}\'".replace('{0}', req.body.Answer).replace(' ', ''))
                .toString()
        );

        sql.Select(connection, query)
            .then(function(ans) {
                if (ans.length > 0) {
                    var myObj = { "CorrectAnswer": true, "Password": ans[0].trim() };
                    res.send(myObj);
                }
                else {
                    var myObj = { "CorrectAnswer": false, "Password": "" };
                    res.send(myObj);
                }
            })
            .catch(function(ans) {
                var myObj = { "CorrectAnswer": false, "Password": "", "Details": ans };
                res.send(myObj);
            })

    });

    app.post('/GetLastLoginTime', function(req, res) {

        //TODO
        //if (!req.query.token) {
        //    res.redirect("http://your.domain/login");
        //    return;
        //}

    });

    app.post('/GetRecommended', function(req, res) {

        buildGetRecommendedQuery(req)
            .then(function(query) {
                sql.Select(connection, query)
                    .then(function(ans) {
                        res.send(ans);
                    })
            })

    });

    app.post('/Search', function(req, res) {

        buildSearchQuery(req)
            .then(function(query) {
                sql.Select(connection, query)
                    .then(function(ans) {
                        res.send(ans);
                    })
            })

    });

    app.post('/GetItemDetails', function(req, res) {

        buildGetItemDetailsQuery(req)
            .then(function(query) {
                sql.Select(connection, query)
                    .then(function(ans) {
                        res.send(ans);
                    })
            })

    });

    app.post('/GetPastOrders', function(req, res) {

        buildGetPastOrdersQuery(req)
            .then(function(query) {
                sql.Select(connection, query)
                    .then(function(ans) {
                        res.send(ans);
                    })
            })

    });

    app.post('/MakeOrder', function(req, res) {
        buildStockCheckQuery(req)
            .then(function(query) {
                sql.Select(connection, query)
                    .then(function(ans) {
                        if (ans.length == 0) {
                            buildMakeOrderQuery(req)
                                .then(function(query) {
                                    sql.Insert(connection, query)
                                        .then(function(success) {
                                            if (success == true)
                                                buildGetOrderIDQuery(req)
                                                    .then(function(query) {
                                                        sql.Select(connection, query)
                                                            .then(function(ans) {
                                                                var id = ans[0].OrderID;
                                                                buildGetOrderItemsQuery(req, id)
                                                                    .then(function(query) {
                                                                        sql.Insert(connection, query)
                                                                            .then(function(ans) {
                                                                                if (success == true)
                                                                                    buildUpdateTotalQuery(req, id)
                                                                                        .then(function(query) {
                                                                                            sql.Update(connection, query)
                                                                                                .then(function(ans) {
                                                                                                    buildUpdateStockQuery(req, id)
                                                                                                        .then(function(query) {
                                                                                                            sql.Update(connection, query)
                                                                                                                .then(function(ans) {
                                                                                                                    res.send(ans);
                                                                                                                })

                                                                                                        })
                                                                                                })
                                                                                        })
                                                                            })
                                                                    })
                                                            })
                                                    })
                                        })
                                })
                        }
                        else
                            res.send(false);
                    })
            })
    });


    app.post('/IsInStock', function(req, res) {

        buildIsInStockQuery(req)
            .then(function(query) {
                sql.Select(connection, query)
                    .then(function(ans) {
                        var verdict = [];
                        if (ans.length > 0)
                            verdict.push(true);
                        else
                            verdict.push(false);
                        res.send(verdict);
                    })

            })

    });

    app.post('/ManagerLogin', function(req, res) {

        validateManagerLogin(req)
            .then(function(query) {
                res.send("Login as manager succeeded");
            })
            .catch(function(reson) {
                res.send(reson);
            })
    });



    let buildStockCheckQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
                items = req.body.Items;
                var query = "SELECT [BeerID] FROM [dbo].[Stock] WHERE ";

                for (i = 0; i < items.length; i++) {
                    if (i > 0) {
                        query += " OR ";
                    }
                    query += "(([Quantity] < \'" + items[i].Quantity + "\') AND ([BeerID] = \'" + items[i].BeerID + "\'))";
                    if (i == items.length - 1) {
                        console.log("Query is: " + query)
                        resolve(query);
                    }
                }
            }
        );
    }

    let buildUpdateStockQuery = function(req, id) {
        return new Promise(
            function(resolve, reject) {
                var query = "UPDATE Table_A SET Table_A.[Quantity] = (Table_A.[Quantity] - Table_B.[Quantity]) FROM [dbo].[Stock] AS Table_A INNER JOIN [dbo].[Orders] AS Table_B ON Table_A.[BeerID] = Table_B.[BeerID] WHERE Table_B.[OrderID] = '{0}'".replace("{0}", id);
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildUpdateTotalQuery = function(req, id) {
        return new Promise(
            function(resolve, reject) {
                var query = (
                    squel.update()
                        .table("[dbo].[User-Orders]")
                        .set("[Total]", squel.select()
                            .field("SUM ([dbo].[Beers].[Price] * [dbo].[Orders].[Quantity])")
                            .from("[dbo].[Orders]")
                            .left_join("[dbo].[Beers]", null, "([Orders].[BeerID] = [Beers].[ID]) AND ([Orders].[OrderID] = '{0}')".replace("{0}", id)))
                        .where("[Username] = '{0}'".replace("{0}", req.body.Username))
                        .where("[OrderDate] = '{0}'".replace("{0}", req.body.OrderDate))
                        .where("[ShippingDate] = '{0}'".replace("{0}", req.body.ShippingDate))
                        .where("[Currency] = '{0}'".replace("{0}", req.body.Currency))
                        .where("[CreditCard] = '{0}'".replace("{0}", req.body.CreditCard))
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildGetOrderItemsQuery = function(req, id) {
        return new Promise(
            function(resolve, reject) {
                items = req.body.Items;
                var query = "INSERT INTO [dbo].[Orders] ([OrderID], [BeerID], [Quantity]) VALUES";

                for (i = 0; i < items.length; i++) {
                    if (i > 0) {
                        query += ",";
                    }
                    query += "('" + id + "\', \'" + items[i].BeerID + "\', \'" + items[i].Quantity + "\')";
                    if (i == items.length - 1) {
                        console.log("Query is: " + query)
                        resolve(query);
                    }
                }
            }
        );
    }

    let buildGetOrderIDQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
                var query = (
                    squel.select()
                        .field("[OrderID]")
                        .from("[dbo].[User-Orders]")
                        .where("[Username] = '{0}'".replace("{0}", req.body.Username))
                        .where("[OrderDate] = '{0}'".replace("{0}", req.body.OrderDate))
                        .where("[ShippingDate] = '{0}'".replace("{0}", req.body.ShippingDate))
                        .where("[Currency] = '{0}'".replace("{0}", req.body.Currency))
                        .where("[CreditCard] = '{0}'".replace("{0}", req.body.CreditCard))
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildMakeOrderQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
                var query = (
                    squel.insert()
                        .into("[dbo].[User-Orders]")
                        .set("[Username]", req.body.Username)
                        .set("[OrderDate]", req.body.OrderDate)
                        .set("[ShippingDate]", req.body.ShippingDate)
                        .set("[Currency]", req.body.Currency)
                        .set("[CreditCard]", req.body.CreditCard)
                        .set("[Total]", null)
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildGetRecommendedQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
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

    let buildGetPastOrdersQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
                var query = (
                    squel.select()
                        .field("[dbo].[User-Orders].[OrderID]")
                        .field("[dbo].[User-Orders].[OrderDate]")
                        .field("[dbo].[User-Orders].[ShippingDate]")
                        .field("[dbo].[User-Orders].[Currency]")
                        .field("[dbo].[User-Orders].[Total]")
                        .field("[dbo].[Beers].[Name]")
                        .field("[dbo].[Beers].[AlcoholPercentage]")
                        .field("[dbo].[Beers].[Price]")
                        .field("[dbo].[Beers].[Volume]")
                        .field("[dbo].[Orders].[Quantity]")
                        .from("[dbo].[User-Orders]")
                        .left_join("[dbo].[Orders]", null, "[dbo].[User-Orders].[OrderID] = [dbo].[Orders].[OrderID]")
                        .left_join("[dbo].[Beers]", null, "[dbo].[Orders].[BeerID] = [dbo].[Beers].[ID]")
                        .where("[dbo].[User-Orders].[Username] = '{0}'".replace("{0}", req.body.Username))
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildSearchQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
                var strWhere = "";
                if (typeof req.body.BeerName !== 'undefined' && req.body.BeerName != "") {
                    strWhere += "[dbo].[Beers].[Name] = '{0}'".replace('{0}', req.body.BeerName);
                }
                if (typeof req.body.CategoryID !== 'undefined' && req.body.CategoryID != "") {
                    if (strWhere != "")
                        strWhere += " AND ";
                    strWhere += "[dbo].[Beers].[CategoryID] = '{0}'".replace('{0}', req.body.CategoryID);
                }
                if (typeof req.body.AlcoholPercentage !== 'undefined' && req.body.AlcoholPercentage != "") {
                    if (strWhere != "")
                        strWhere += " AND ";
                    strWhere += "[dbo].[Beers].[AlcoholPercentage] = '{0}'".replace('{0}', req.body.AlcoholPercentage);
                }
                if (typeof req.body.Price !== 'undefined' && req.body.Price != "") {
                    if (strWhere != "")
                        strWhere += " AND ";
                    strWhere += "[dbo].[Beers].[Price] = '{0}'".replace('{0}', req.body.Price);
                }
                if (typeof req.body.Volume !== 'undefined' && req.body.Volume != "") {
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

    let buildGetItemDetailsQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
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

    let buildIsInStockQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
                var query = (
                    squel.select()
                        .from("[dbo].[Stock]")
                        .where("[dbo].[Stock].[BeerID] = {0}  AND [dbo].[Stock].[Stock] >= {1}".replace('{0}', req.body.BeerID)
                            .replace('{1}', req.body.Quantity))
                        .toString()
                );
                console.log("Query is: " + query)
                resolve(query)
            }
        );
    }

    let buildGetCountriesQuerry = function(req) {
        return new Promise(
            function(resolve, reject) {
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

    let buildGetGetHottest5Querry = function(req) {
        return new Promise(
            function(resolve, reject) {
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


    let buildGetNewProductsQuerry = function(req) {
        return new Promise(
            function(resolve, reject) {
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
    let CheckIfUniqueUserName = function(req) {
        console.log("build new promise")

        return new Promise(
            function(resolve, reject) {
                var name = req.body.Username.toString();
                var query = (
                    squel.select()
                        .from("[dbo].[Users]")
                        .field("[Users].[Username]")
                        .where("[Users].[Username] = " + "'" + name + "'")
                        .toString()
                );
                console.log("Query is: " + query)
                sql.Select(connection, query).then(
                    function(ans) {
                        if (ans.length == 0)
                            resolve(true)
                        else
                            reject("User name already exists");
                    })
            }
        )

    }


    let UpdateNewUserInUsersTable = function(req) {
        console.log("build new promise")

        return new Promise(
            function(resolve, reject) {
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
                console.log("Query is: " + query)

                sql.Insert(connection, query)
                    .then(function(succeeded) {
                        resolve(true)
                    })
                    .catch(
                    function(ans) {
                        reject(ans);
                    })

            });
    }

    let UpdateSecurityQuestion = function(req) {
        return new Promise(
            function(resolve, reject) {

                generateSecurityQuestionQuery(req)
                    .then(function(query) {
                        console.log(query)
                        sql.Insert(connection, query)
                            .then(function(succeeded) {
                                resolve(succeeded);
                            })
                            .catch(function(ans) {
                                reject(ans)
                            })
                    })

            });

    }

    let generateSecurityQuestionQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
                questions = req.body.SecurityQuestions;
                var query = "INSERT INTO [Questions] (Username, Question, Answer ) VALUES ";
                for (i = 0; i < questions.length; i++) {
                    if (i > 0) {
                        query += ",";
                    }
                    query += "('" + req.body.Username + "\', \'" + questions[i].Question.replace('\?', '') + "\', \'" + questions[i].Answer + "\')";
                    if (i == questions.length - 1) {
                        console.log("Query is: " + query)
                        resolve(query);
                    }
                }
            });
    }

    let UpdateUserCategories = function(req) {
        return new Promise(
            function(resolve, reject) {

                generateCatgeoriesQuery(req)
                    .then(function(query) {
                        console.log(query)
                        sql.Insert(connection, query)
                            .then(function(succeeded) {
                                resolve(succeeded);
                            })
                            .catch(function(ans) {
                                reject(ans)
                            })
                    })

            });

    }

    let generateCatgeoriesQuery = function(req) {
        return new Promise(
            function(resolve, reject) {
                categories = req.body.Categories;
                var query = "INSERT INTO [User-Categories] (Username, CategoryID ) VALUES ";
                for (i = 0; i < questions.length; i++) {
                    if (i > 0) {
                        query += ",";
                    }
                    query += "('" + req.body.Username + "\', " + categories[i] + " )";
                    if (i == questions.length - 1) {
                        resolve(query);
                    }
                }
            });
    }

    let validateLoginDetails = function(req) {
        return new Promise(
            function(resolve, reject) {
                var name = req.body.Username;
                var pass = req.body.Password;
                var query = (
                    squel.select()
                        .from("[dbo].[Users]")
                        .where("[dbo].[Users].[Username] = \'{0}\'  AND [dbo].[Users].[Password] = \'{1}\'".replace('{0}', name)
                            .replace('{1}', pass))
                        .toString()
                );
                sql.Select(connection, query)
                    .then(function(ans) {
                        if (ans.length == 1)
                            resolve(true)
                        else
                            reject("Wrong Username/Password");
                    })
                    .catch(function(ans) {
                        reject(ans);
                    })

            });
    }

    let validateManagerLogin = function(req) {
        return new Promise(
            function(resolve, reject) {
                var name = req.body.Username;
                var pass = req.body.Password;

                var query = (
                    squel.select()
                        .from("[dbo].[Users]")
                        .where("[dbo].[Users].[Username] = \'{0}\'".replace('{0}', name))
                        .where("[dbo].[Users].[IsManager] = 1")
                        .where("[dbo].[Users].[IsManager] = 1".replace('{1}', pass))
                        .toString()
                );
                sql.Select(connection, query)
                    .then(function(ans) {
                        if (ans.length == 1)
                            resolve(true)
                        else
                            reject("You don`t have admin permission. Please go.");
                    })
                    .catch(function(ans) {
                        reject(ans);
                    })

            });
    }

    let validateUserIsManager = function(req) {
        return new Promise(
            function(resolve, reject) {
                var name = req.body.Username;
                var query = (
                    squel.select()
                        .from("[dbo].[Users]")
                        .where("[dbo].[Users].[Username] = \'{0}\'  AND [dbo].[Users].[IsManager] = 1".replace('{0}', name))
                        .toString()
                );
                sql.Select(connection, query)
                    .then(function(ans) {
                        if (ans.length == 1)
                            resolve(true)
                        else
                            reject("You don`t have admin permission. Please go.");
                    })
                    .catch(function(ans) {
                        reject(ans);
                    })

            });
    }

});

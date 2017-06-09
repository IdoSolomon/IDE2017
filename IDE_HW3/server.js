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
app.use(cors());
app.use(bodyParser.json()); // Enabling access to "req.body" as a json file.
app.use(express.cookieParser());
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

        var query = (
            squel.select()
                .from("Countries")
                .field("Name")
                .toString()
        );

        sql.Select(connection, query, function (ans) { res.send(ans); });

    });

    app.get('/GetHottest5', function (req, res) {
        var currentDate = moment().format('YYYY-MM-DDThh:mm:ss');
        var query = (
            squel.select()
                .from("Beers")
                .field("TOP(5) ID, Name, Count(*)")
                .join("Orders", null, "Beers.ID=Orders.BeerID")
                .join("User-Orders", null, "Orders.OrderID=User-Orders.OrderID")
                .where("DATEDIFF(day ,? ,currentDate) <= 5", currentDate)
                .order("Count(*)", false)
                .toString()
        );

        sql.Select(connection, query, function (ans) { res.send(ans); });

    });

    app.get('/GetNewProducts', function (req, res) {
        var currentDate = moment().format('YYYY-MM-DDThh:mm:ss');
        var query = (
            squel.select()
                .from("Beers")
                .where("DATEDIFF(day ,? ,currentDate) <= 30", currentDate)
                .toString()
        );

        sql.Select(connection, query, function (ans) { res.send(ans); });

    });

    app.get('/GetConversionRate', function (req, res) {
        var ans = [];
        ans.push(conversionRate);
        res.send(ans);

    });

    app.post('/Register', function (req, res) {
        //req.body takes form params
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
        //var query = (
        //    squel.insert()
        //        .into("Users")
        //        .set("Username", "Test")
        //        .set("Password", "testing")
        //        .set("CountryID", 5)
        //        .toString()
        //);
        sql.Insert(connection, query, function (ans) { res.send(ans); });
    });

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
});

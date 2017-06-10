var Connection = require('tedious').Connection;
var Request = require('tedious').Request;



//function format(fmtstr) {
//    var args = Array.prototype.slice.call(arguments, 1);
//    return fmtstr.replace(/\{(\d+)\}/g, function (match, index) {
//        return args[index];
//    });
//}

exports.Select = function (connection, query) {
    return new Promise(function(resolve, reject){
        console.log('Reading rows from the Table...');
        console.log(query);

        var info = [];
        var res = [];

        var req = new Request(query, function (err, rowCount) {
            if (err) {
                console.log(err);
            }
        });

        req.on('columnMetadata', function (columns) {

            columns.forEach(function (column) {
                if (column.colName !== null) {
                    info.push(column.colName);
                }
            });
        });

        req.on('row', function (row) {

            var item = {};
            for (i = 0; i < row.length; i++) {
                item[info[i]] = row[i].value;
            }
            res.push(item);
        });

        req.on('requestCompleted', function () {

            resolve(res);
        });

        connection.execSql(req);
    });
}

exports.Insert = function(connection, query) {
    console.log('Adding rows to the Table...');
    console.log(query);

    return new Promise(function (resolve, reject) {
        var req = new Request(query, function (err, rowCount) {
            if (err) {
                console.log(err);
            }
        });

        req.on('requestCompleted', function () {

            resolve(true);
        });

        connection.execSql(req);
    });

}

exports.Delete = function(connection, query, callback) {
    console.log('Removing rows from the Table...');

    var req = new Request(query, function (err, rowCount) {
        if (err) {
            console.log(err);
        }
    });

    req.on('requestCompleted', function () {
        
        callback("Request Completed");
    });

    connection.execSql(req);

}

exports.Update = function(connection, query, callback) {
    console.log('Changing rows in the Table...');

    var req = new Request(query, function (err, rowCount) {
        if (err) {
            console.log(err);
        }
    });

    req.on('requestCompleted', function () {
        
        callback("Request Completed");
    });

    connection.execSql(req);

}




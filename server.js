var express = require('express');
var app = express();
// var pg = require('pg');  //Commented out until database implementation
var http = require('http').Server(app);
var io = require('socket.io')(http);
var google = require('google');

google.resultsPerPage = 25;
// var nextCounter = 0;

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'critisearch',
  password : 'asdfjklj',
  database : 'critisearch'
});

connection.connect();
// connection.end();

//-------------------------------------------------------------------------
/**
 *  The server file for the Critisearch app, handles client interaction
 *  and provides functionality on the back-end that controllers alone 
 *  are insufficient for.
 *
 *  @authors Michael Stewart, Joe Bruzek
 *  @version v 0.0.0  (2014)
 */
//-------------------------------------------------------------------------

/**
 * ~~ Initialization ~~
 * Steps required to start up the app and provide future functions with
 * variables they will use.
 */
  app.use(express.static(__dirname + '/app'));

  var port = 3017;
  http.listen(port, function (){
    console.log('listening on *:', port);
  });

  // var allThoughts = {};
  // var chronologicalThoughts = [];
  // var newQuestion = '';

  // /**
  //  * Will return the number of unique ids in allThoughts which correlates
  //  * to the amount of submitters.
  //  */
  // function numSubmitters () {
  //   return Object.keys(allThoughts).length;
  // }

  // /**
  //  * [Needs proper description]
  //  */
  // function addThought (socket, thought) {
  //   chronologicalThoughts.push(thought);
  //   if (allThoughts.hasOwnProperty(socket.id)) {
  //     allThoughts[socket.id].push(thought);
  //   }
  //   else {
  //     //this means we just got a new submitter
  //     allThoughts[socket.id] = [thought];
  //     socket.broadcast.to('teacher').emit('num-submitters', numSubmitters());
  //   }
  // }

//-------------------------------------------------------------------------

function getProcessedResults (results) {
  var resultsToSend = [];
  for (var i=0; i<results.length; i++) {
    if (results[i].hasOwnProperty('link') && results[i].title.length > 0) {
      results[i].status = 0;
      resultsToSend.push(results[i]);
    }

    var images  = "Images for ";
    var news = "News for ";
    var maps = "Map for ";
    var youtube = "http://www.youtube.com/watch?v=";


    if (results[i].title.substr(0, images.length) == images
      || results[i].title.substr(0, news.length) == news
      || results[i].title.substr(0, maps.length) == maps) {
      console.log("Item removed: " + results[i].title);
      resultsToSend.pop();
    } else if (results[i].hasOwnProperty('link') && results[i].link != null){
      console.log(results[i].link);
      if (results[i].link.substr(0, youtube.length) == youtube) {
        results[i].description = "Youtube link";
      }
    }
  }
  return resultsToSend;
}

/**
 * ~~ Activity ~~
 * The main functions of the server, listening for events on the client
 * side and responding appropriately.
 */
 io.sockets.on('connection', function (socket) {
  console.log('>> Client Connected  >> ');
  var connectionInfo = {};

  var addClientQuery = 'insert into critisearch_client (socket, connect) values (?, ?)';
  connection.query(addClientQuery, [socket.id, new Date()], function(error, results){
    console.log(error);
    console.log(results);
    if (results.hasOwnProperty('insertId')) {
      connectionInfo['dbId'] = results.insertId;
    }
  });
  /**
   * Will catch when a client leaves the app interface entirely and send
   * out the updated number of connected students for the teacher view.
   */
  socket.on('disconnect', function () {
    console.log('<< Client Disconnected << ');

    var addDisconnectTime = 'update critisearch_client set disconnect = ? where id = ?';
    connection.query(addDisconnectTime, [new Date(), connectionInfo.dbId], function(error, results){
    console.log(error);
    console.log(results);
  });

  });

  /**
   *
   * Handle when someone tries to sign up
   */
  socket.on('signup', function(username, password, email) {
    console.log('Database add ' + username + ', ' + password + ', ' + email);

    var usernames = 'select * from user where name=?';

    connection.query(usernames, [username], function(error, results) {
      if (results.length > 0) {
        console.log("Username already exists");
      } else if (email != null) {
        var newUser = 'insert into user (name, password, email) values (?, ?, ?)'
        connection.query(newUser, [username, password, email], function(error, results) {
          socket.emit('userAdded', results);
        });
      } else {
        console.log("invalid email");
      }
    });

    // This works but who knows why
    /*if (connection.query(usernames, [username], function(error, results) {
        return (results.length > 0);
      })) {
      console.log("Username already exists");
    } else if (email != null) {
      var newUser = 'insert into user (name, password, email) values (?, ?, ?)'
      connection.query(newUser, [username, password, email], function(error, results) {
        socket.emit('userAdded', results);
      });
    } else {
      console.log("invalid email");
    }*/
  });

  /**
   *
   * Handle when someone tries to Log in
   */
  socket.on('logIn', function(username, password) {
    console.log('Searching for ' + username + ', ' + password);

    var newUser = 'select * from user where name=?';
    connection.query(newUser, [username], function(error, results) {
      var success = false;
      for (var i = 0; i < results.length; i++) {
        if (username == results[i].name && password == results[i].password) {
          success = true;
          console.log("User match");
        }
      }
      socket.emit('logIn-done', success);
    });
  });

  /**
   *
   * Handle when a teacher joins the room
   */
  socket.on('teacher', function() {
    console.log('Teacher Joined')
    socket.join('teacher');
    var oldResults = 'SELECT * FROM critisearch_query where time > date_sub(now(),INTERVAL 90 MINUTE) order by time desc;';
    connection.query(oldResults, function(error, results) {
      socket.emit('oldQueries', results);
    });
  });

  socket.on('info-for-server', function(msg) {
    console.log(msg.data);
  });

  socket.on('q', function(q) {

    socket.broadcast.to('teacher').emit('query', q);

    var newQuery = 'insert into critisearch_query (query, searcher, time) values (?, ?, ?)';
    console.log(q, connectionInfo.dbId, new Date());
    connection.query(newQuery, [q, connectionInfo.dbId, new Date()], function(error, results){
      console.log(error);
      console.log(results);
      if (results.hasOwnProperty('insertId')) {
        connectionInfo['currentQuery'] = results.insertId;
      }
    });

    google(q, function(err, next, results) {

      var processedResults = getProcessedResults(results);
      
      socket.emit('search-results', processedResults);

      for (var x = 0; x < processedResults.length; x++) {
        
        var newResult = 'insert into critisearch_result (link, description, result_order, query, title) values (?, ?, ?, ?, ?)';

        connection.query(newResult, [processedResults[x].link, 
            processedResults[x].description, 
            x, 
            connectionInfo.currentQuery, 
            processedResults[x].title], function(error, results){
          console.log(error);
          console.log(results);
        });
      }

    });
  });
});
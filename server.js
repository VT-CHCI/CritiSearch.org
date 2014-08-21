var express = require('express');
var app = express();
// var pg = require('pg');  //Commented out until database implementation
var http = require('http').Server(app);
var io = require('socket.io')(http);
var google = require('google');
var async = require('async');

// Limit the results per page for testing
google.resultsPerPage = 3;
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
    // for now just remove these
    //if results[i].title == Images for... && results[i].link == null
    //   make a image search of google, and send back the picture data
  }
  return resultsToSend;
}

function wrapperForInsert(result, newResult, connectionInfo, i) {
  return function(callback) {
    console.log('running task i:', i);
    console.log('running task result:', result);
    connection.query(newResult, [
      result.link, 
      result.description, 
      i, 
      connectionInfo.currentQuery, 
      result.title
    ], function(error, results){
      console.log(error);
      console.log(results);
      console.log(results.insertId);
      result.id = results.insertId;
      callback(null, result);
    });
  };
}

function getTasks(processedResults, connectionInfo) {
  console.log('getTasks');
  var tasks = [];
  for (i in processedResults) {
    var result = processedResults[i];
    console.log(result);
    var newResult = 'insert into critisearch_results (link, description, result_order, query, title) values (?, ?, ?, ?, ?)';
    tasks.push(wrapperForInsert(result, newResult, connectionInfo, i));
    i++;
  }
  console.log(tasks);
  return tasks;
}

//got the lists for this from: http://stackoverflow.com/q/16826200/1449799
 
function getName() {
  var firstName = ["Runny", "Buttercup", "Dinky", "Stinky", "Crusty",
  "Greasy","Gidget", "Cheesypoof", "Lumpy", "Wacky", "Tiny", "Flunky",
  "Fluffy", "Zippy", "Doofus", "Gobsmacked", "Slimy", "Grimy", "Salamander",
  "Oily", "Burrito", "Bumpy", "Loopy", "Snotty", "Irving", "Egbert", "Waffer", "Lilly","Rugrat","Sand", "Fuzzy","Kitty",
   "Puppy", "Snuggles","Rubber", "Stinky", "Lulu", "Lala", "Sparkle", "Glitter",
   "Silver", "Golden", "Rainbow", "Butt", "Rain", "Stormy", "Wink", "Sugar",
   "Twinkle", "Star", "Halo", "Angel"];
 
  // var middleName =["Waffer", "Lilly","Rugrat","Sand", "Fuzzy","Kitty",
  //  "Puppy", "Snuggles","Rubber", "Stinky", "Lulu", "Lala", "Sparkle", "Glitter",
  //  "Silver", "Golden", "Rainbow", "Butt", "Rain", "Stormy", "Wink", "Sugar",
  //  "Twinkle", "Star", "Halo", "Angel"];
 
  var lastName1 = ["Snicker", "Buffalo", "Gross", "Bubble", "Sheep",
   "Corset", "Toilet", "Lizard", "Waffle", "Kumquat", "Burger", "Chimp", "Liver",
   "Gorilla", "Rhino", "Emu", "Pizza", "Toad", "Gerbil", "Pickle", "Tofu", 
  "Chicken", "Potato", "Hamster", "Lemur", "Vermin"];
 
  var lastName2 = ["face", "dip", "nose", "brain", "head", "breath", 
  "pants", "shorts", "lips", "mouth", "muffin", "butt", "bottom", "elbow", 
  "honker", "toes", "buns", "spew", "kisser", "fanny", "squirt", "chunks", 
  "brains", "wit", "juice", "shower"];
 
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
 
  return firstName[getRandomInt(0, firstName.length)] + " " + 
    // middleName[getRandomInt(0, middleName.length)] + " " +
    lastName1[getRandomInt(0, lastName1.length)] + " " +
    lastName2[getRandomInt(0, lastName2.length)];
}

/**
 * add a student to the user table
 */
function addStudent(classId) {
  var name = getName();
  var searchName = 'select * from users where name=?';
  connection.query(searchName, [name], function(error, results) {
    if (results.length > 0) {
      addStudent(classId);
    } else {
      var addStudent = 'insert into users (name) values (?)';
      connection.query(addStudent, [name], function(error, results) {
        var userId = results.insertId;
        var membershipQuery = 'insert into critisearch_role_memberships (uid, role_id, gid) values (?, ?, ?)';
        connection.query(membershipQuery, [userId, 2, classId], function(error, results) {
          console.log("Added user " + userId + " to class " + classId);
        });
      });
    }
  });
  return {username: name};
}

/**
 * get an array of names for the class, add them to the class
 * and create them as users.
 */
function getNames(count, classId, teacherId) {
  var names = [];
  for (var i = 0; i < count; i++) {
    names[i] = addStudent(classId);
  }
  return names;
}

/**
 * ~~ Activity ~~
 * The main functions of the server, listening for events on the client
 * side and responding appropriately.
 */
io.sockets.on('connection', function (socket) {
  console.log('>> Client Connected  >> ');
  var connectionInfo = {};

  var addClientQuery = 'insert into critisearch_clients (socket, connect) values (?, ?)';
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

    var addDisconnectTime = 'update critisearch_clients set disconnect = ? where id = ?';
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

    var usernames = 'select * from users where name=?';

    connection.query(usernames, [username], function(error, results) {
      if (results.length > 0) {
        console.log("Username already exists");
      } else if (email != null) {
        var newUser = 'insert into users (name, password, email) values (?, ?, ?)'
        connection.query(newUser, [username, password, email], function(error, results) {
          socket.emit('login-teacher-done', {success: true});
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
  socket.on('login-teacher', function(details) {
    console.log('Searching for ' + details.username + ', ' + details.password);

    var newUser = 'select * from users where name=?';
    connection.query(newUser, [details.username], function(error, results) {
        if (details.username == results[0].name && details.password == results[0].password) {
          console.log(results);
          console.log("User match");
          connectionInfo['teacherId'] = results[0].id;
          socket.emit('login-teacher-done', {success: true});
      }
    });
  });

  /**
   * when the teacher creates a new class
   */
  socket.on('create-class', function(name, number) {
    var newClassQuery = 'insert into critisearch_groups(name, owner) values (?, ?)';
    console.log(connectionInfo.teacherId);
    connection.query(newClassQuery, [name, connectionInfo.teacherId], function(error, results) {
      console.log(error);
      console.log(results);

      var groupId = results.insertId;

      var teacherRole = 'insert into critisearch_role_memberships (uid, role_id, gid) values (?, ?, ?)';
      connection.query(teacherRole, [connectionInfo.teacherId, 1, groupId], function(error, results) {
        console.log(error);
        console.log(results);
      });

      //return the names list toat goes with this class
      socket.emit('class-created', name, number, getNames(number, groupId, connectionInfo.teacherId));
    });
  });

  socket.on('login-student', function(details) {
    console.log('Searching for ' + details.sillyname);

    var newUser = 'select * from users where name=?';
    connection.query(newUser, [details.sillyname], function(error, results) {
      var complete = {
        success: false
      }
      console.log("Looking for " + results[0].name);
      if (details.sillyname == results[0].name) {
        complete.success = true;
        console.log("User match");
      }
      socket.emit('login-student-done', complete);
    });
  });

  socket.on('teacher', function() {
    console.log('Teacher Joined')
    socket.join('teacher');
    var oldResults = 'SELECT * FROM critisearch_queries where time > date_sub(now(),INTERVAL 90 MINUTE) order by time desc;';
    connection.query(oldResults, function(error, results) {
      socket.emit('oldQueries', results);
    });
  });

  socket.on('info-for-server', function(msg) {
    console.log(msg.data);
  });

  socket.on('promoted', function() {
    //id 3
    var promotedQuery = 'insert into critisearch_events (type, time, client, result) values (?, ?, ?, ?)';
    connection.query(promotedQuery, [3, new Date(), connectionInfo.dbId, 1], function(error, results) {
      console.log(error);
      console.log(results);
    });
  });


  /**
   * When the user searches
   */
  socket.on('q', function(q) {

    socket.broadcast.to('teacher').emit('query', q);

    var newQuery = 'insert into critisearch_queries (query, searcher, time) values (?, ?, ?)';
    console.log(q, connectionInfo.dbId, new Date());
    connection.query(newQuery, [q, connectionInfo.dbId, new Date()], function(error, results){
      console.log(error);
      console.log(results);
      if (results.hasOwnProperty('insertId')) {
        var id = results.insertId;
        console.log('query db id:', id);
        connectionInfo['currentQuery'] = id;

        //Log the query event to the database
        var newEvent = 'insert into critisearch_events (type, time, client, query) values (?, ?, ?, ?)';
        connection.query(newEvent, [1, new Date(), connectionInfo.dbId, connectionInfo.currentQuery], function(error, results) {
          console.log(error);
          console.log(results);
        });
      }
    });

    google(q, function(err, next, results) {

      var processedResults = getProcessedResults(results);

      async.parallel(getTasks(processedResults, connectionInfo), function(error, results) {
        console.log('parallel callback');
        console.log(error);
        console.log(results);
        socket.emit('search-results', results);
      });

      // for (var x = 0; x < processedResults.length; x++) {
        
      //   var newResult = 'insert into critisearch_results (link, description, result_order, query, title) values (?, ?, ?, ?, ?)';

      //   connection.query(newResult, [processedResults[x].link, 
      //       processedResults[x].description, 
      //       x, 
      //       connectionInfo.currentQuery, 
      //       processedResults[x].title], function(error, results){
      //     console.log(error);
      //     console.log(results);
      //     console.log(results.insertId);

      //   });
      // }

    });
  });
});
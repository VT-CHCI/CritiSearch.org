'use strict';

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

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http); // api docs: http://socket.io
var google = require('google'); // api docs: https://www.npmjs.com/package/google
// var async = require('async');  //probbaly shouldn't need this now with promises
var models = require('./models');
var _ = require('lodash');
'use strict' 
var scholar = require('google-scholar');

google.requestOptions = {
  timeout: 30000,
  gzip: true,
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en;q=0.5',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'DNT': 1
  }
}

let scholarResultsCallback = socket => {
  return response => {
    console.log('response');
    var processedResults = getProcessedScholarResults(response.results);
    console.log(processedResults.length)
    // console.log(JSON.stringify('processedResults' + processedResults));
    responsesForClient[socket.id].response = response;
    console.log('responsesForClient[socket.id].response');
    var incrementIndex = responsesForClient[socket.id].nextIndex;
    console.log('increment')
    var arrayOfPromisesForEachCreatedResultInSequelize = processedResults.map(function(result, idx) {
      console.log(idx)
      console.log(result)
      console.log('map')
      return models.Result.create({
        link: result.url,
        description: result.description,
        result_order: idx + incrementIndex,
        title: result.title,
        result_relevance: models.RELEVANCE.VOTE_NONE,
        queryId: responsesForClient[socket.id].query.id,
        cited_count:result.citedCount,
        cited_url:result.citedUrl,
        related_url:result.relatedUrl,
        link_visited: false
      })
        .catch(function (err){
           console.log('error')
           console.log(err)
        });
    });
    responsesForClient[socket.id].nextIndex +=processedResults.length
    Promise.all(arrayOfPromisesForEachCreatedResultInSequelize)
      .then(function(sequelizeResults) {
        console.log('aboutto emit')
        socket.emit('search-results-scholar', sequelizeResults);
      })
       .catch(function (err){
        console.log('error')
        console.log(err)
       });
  };
};
 


// Limit the results per page for testing
google.resultsPerPage = 10;
// This dictionary holds the respone object for the search results for a client using the socket id
var responsesForClient= {};
/**
 * ~~ Initialization ~~
 * Steps required to start up the app and provide future functions with
 * variables they will use.
 */
models.start()
  .then(function() {
    // here we will put any code that should wait for the db to be ready.

    // serve static files from the app directory, directly, without "app/" in URL
    app.use(express.static(__dirname + '/app'));

    var port = 80;
    http.listen(port, function() {
      console.log('listening on *:', port);
    });

  });





//-------------------------------------------------------------------------

// function for filtering Scholar Results. Do not know yet if it is required
function getProcessedScholarResults(results) {

  var resultsToSend = [];
  for (var i = 0; i < results.length; i++) {
    if (results[i].hasOwnProperty('url') && results[i].title.length > 0) {
      results[i].status = 0;
      resultsToSend.push(results[i]);
    }
  }
  return resultsToSend;
}
  



// filters out google's enhanced results
function getProcessedResults(results) {

  var resultsToSend = [];
  for (var i = 0; i < results.length; i++) {
    if (results[i].hasOwnProperty('link') && results[i].title.length > 0) {
      results[i].status = 0;
      resultsToSend.push(results[i]);
    }

    var images = "Images for ";
    var news = "News for ";
    var maps = "Map for ";
    var youtube = "http://www.youtube.com/watch?v=";


    if (results[i].title.substr(0, images.length) == images || results[i].title.substr(0, news.length) == news || results[i].title.substr(0, maps.length) == maps) {
      console.log("Item removed: " + results[i].title);
      resultsToSend.pop();
    } else if (results[i].hasOwnProperty('link') && results[i].link != null) {
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

//got the lists for this from: http://stackoverflow.com/q/16826200/1449799
let FIRST_NAME = ["Runny", "Buttercup", "Dinky", "Stinky", "Crusty",
  "Greasy", "Gidget", "Cheesypoof", "Lumpy", "Wacky", "Tiny", "Flunky",
  "Fluffy", "Zippy", "Doofus", "Gobsmacked", "Slimy", "Grimy", "Salamander",
  "Oily", "Burrito", "Bumpy", "Loopy", "Snotty", "Irving", "Egbert", "Waffer", "Lilly", "Rugrat", "Sand", "Fuzzy", "Kitty",
  "Puppy", "Snuggles", "Rubber", "Stinky", "Lulu", "Lala", "Sparkle", "Glitter",
  "Silver", "Golden", "Rainbow", "Butt", "Rain", "Stormy", "Wink", "Sugar",
  "Twinkle", "Star", "Halo", "Angel"
];

let LAST_NAME_1 = ["Snicker", "Buffalo", "Gross", "Bubble", "Sheep",
  "Corset", "Toilet", "Lizard", "Waffle", "Kumquat", "Burger", "Chimp", "Liver",
  "Gorilla", "Rhino", "Emu", "Pizza", "Toad", "Gerbil", "Pickle", "Tofu",
  "Chicken", "Potato", "Hamster", "Lemur", "Vermin"
];

let LAST_NAME_2 = ["face", "dip", "nose", "brain", "head", "breath",
  "pants", "shorts", "lips", "mouth", "muffin", "butt", "bottom", "elbow",
  "honker", "toes", "buns", "spew", "kisser", "fanny", "squirt", "chunks",
  "brains", "wit", "juice", "shower"
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getName() {
  return FIRST_NAME[getRandomInt(0, FIRST_NAME.length)] + " " +
    LAST_NAME_1[getRandomInt(0, LAST_NAME_1.length)] +
    LAST_NAME_2[getRandomInt(0, LAST_NAME_2.length)];
}

/**
 * add a student to the user table
 */
function addStudent(classId) {
  console.log('Creating student for class::' + classId);
  var name = getName();
  return models.User.findOrCreate({
      where: {
        name: name,
        role: models.ROLES.PARTICIPANT
      }
    })
    .spread(function(thisUser, created) {
      if (created) {
        onsole.log('User created successfully');
        return thisUser;
      } else {
        return addStudent(classId);
      }
    });
}

function range(start, stop, step) {
  if (typeof stop == 'undefined') {
    // one param defined
    stop = start;
    start = 0;
  }

  if (typeof step == 'undefined') {
    step = 1;
  }

  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return [];
  }

  var result = [];
  for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }

  return result;
};

/**
 * get an array of names for the class, add them to the class
 * and create them as users.
 */

function getUniqueName () {
  var proposedName = getName();

  return models.User.findOrCreate({
    where: {
      name: proposedName,
      role: models.ROLES.PARTICIPANT
    }
  })
    .spread(function (user, created) {
      if (!created) {

        return getUniqueName();
      } else{

        return user;
      }
    });
}

function getNames(count) {
  return range(count).map(function () {
    return getUniqueName();      
  });
  // var names = [];
  // mdn is really the best js resource
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  return Promise.all(_.range(count).map(function() {
    return (classId); // TODO: is this a race condition for unique sillynames?
  }));
}

// getCLasses used to use the socket to emit the result. now we will make the caller do this

function getClasses(teacher) { // teacher is a user obj
  return teacher.getGroups();
}

/**
 * Get a random key. used by cookies
 * Packaged in a function for readability
 */
function getKey() {
  return Math.floor((Math.random() * 999999999) + 1);
}

/**
 * ~~ Activity ~~
 * The main functions of the server, listening for events on the client
 * side and responding appropriately.
 */
io.sockets.on('connection', function(socket) {
  let connectedAt = new Date();
  console.log('>> Client Connected  >> ', connectedAt);
  var connectionInfo = {};

  models.Client.create({
      socketid: socket.id,
      connected: connectedAt
    })
    .then(function(newClient) {
      console.log('newclient created with id', newClient.id);
      connectionInfo['dbId'] = newClient.id;
    });
  // .then store the client db id?

  // var addClientQuery = 'insert into critisearch_clients (socket, connect) values (?, ?)';
  // connection.query(addClientQuery, [socket.id, new Date()], function(error, results){
  //   console.log(error);
  //   console.log(results);
  //   if (results && results.hasOwnProperty('insertId')) {
  //     connectionInfo['dbId'] = results.insertId;
  //   }
  // });

  /**
   * Will catch when a client leaves the app interface entirely and send
   * out the updated number of connected students for the teacher view.
   */
  socket.on('disconnect', function() {
    console.log("socket.on('disconnect', function()");
    let disconnectedAt = new Date();
    console.log('<< Client with id', socket.id, 'Disconnected at time', disconnectedAt, '<<');

    return models.Client.findOne({
      where: {
        socketid: socket.id
      }
    }).then(function(newlyDisconnectedClient) {
      if (newlyDisconnectedClient) {
        newlyDisconnectedClient.disconnected = disconnectedAt;
        newlyDisconnectedClient.save();
      }
    });
  });

  /**
   *
   * Handle when someone tries to sign up
   */
  socket.on('signup', function(username, password, email, cookie) {
    console.log("socket.on('signup', function(username, password, email, cookie)");
    console.log('Database add ' + username + ', ' + password + ', ' + email);

    var reason;


    models.User.isUniqueName(username)
      .then(function(isUnique) {
        if (!isUnique) {
          reason = 'Username already exists';
          console.log(reason);
          socket.emit('userNotAdded', {
            reason: reason
          });
        } else {
          console.log('creating a new teacher as a user');
          models.User.create({
            email: email,
            name: username,
            password: password,
            role: models.ROLES.FACILITATOR
          }).then(function(user) {
            connectionInfo['teacherId'] = user.id;
            models.Client.findOne({
              where: {
                socketid: socket.id
              }
            }).then(function(client) {
              client.userId = user.id;
              client.save();
              
              var cookiekey = getKey();
              console.log('cookie has key::' + cookiekey);
              models.Cookie.create({
                uid: user.id,
                key: cookiekey
          });
            })
            socket.emit('login-teacher-done', {
              success: true,
              user: {
                name: username,
                groups: [],
              },
              uid: user.id,
              key: getKey()
            });
          });
        }
      });
    // connection.query(usernames, [username], function(error, results) {
    //   if (results.length > 0) {
    //   console.log("Username already exists");
    //   } else if (email != null) {
    //   var newUser = 'insert into users (name, password, email) values (?, ?, ?)'
    //   connection.query(newUser, [username, password, email], function(error, results) {
    //     console.log(results);

    //     connectionInfo['teacherId'] = results.insertId;
    //     socket.emit('login-teacher-done', {success: true});
    //   });
    //   } else {
    //   console.log("invalid email");
    //   }
    // });

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
    console.log("socket.on('login-teacher', function(details)");
    console.log('Searching for ' + details.username + ', ' + details.password);

    models.User.findOne({
        where: {
          name: details.username
        },
        include: [{
          model: models.Group,
          include: [{
            model: models.User
          }]
        }]
      })
      .then((user) => {
        if (user) {
          // check the password
          if (user.password === details.password) {
            var data = {
              success: true,
              user: user,
              uid: user.id,
              key: getKey()
            }
            models.Client.findOne({
              where: {
                socketid: socket.id
              }
            }).then(function(client) {
              client.userId = user.id;
              client.save();
            });
            socket.emit('login-teacher-done', data);
          } else {
            console.log("incorrect password");
            socket.emit('login-failed');
          }
        } else {
          console.log("wrong username");
          socket.emit('login-failed');
        }
      });
  });

  socket.on('check-cookies', function(cookies) {

    console.log("socket.on('check-cookies', function(cookies)");
    console.log('logging cookies ::' + JSON.stringify(cookies));

    models.Cookie.findOne({
        where: {
          key: cookies.key,
          uid: cookies.uid
        }
      })
      .then((cookieResults) => {
        console.log('cookie results ::' + JSON.stringify(cookieResults));
        if (cookieResults ) {
          console.log('cookie matched');
          socket.emit('cookies-login', {
            uid: cookies.uid,
            key: cookies.key
          });
        }
      });
  });

  socket.on('check-cookies-student', function(cookies) {
    console.log("socket.on('check-cookies-student', function(cookies)");
    console.log('checking cookies for student');
    console.log('logging cookies ::' + JSON.stringify(cookies));

    models.Cookie.findOne({
        where: {
          key: cookies.key,
          uid: cookies.uid
        }
      })
      .then((cookieResults) => {
        console.log('cookie results ::' + JSON.stringify(cookieResults));
        if (cookieResults ) {
          console.log('cookie matched');
          socket.emit('cookies-login-student', {
            uid: cookies.uid,
            key: cookies.key
          });
        }
      });
  });



  socket.on('update-cookies', function(cookies) {
    console.log("socket.on('update-cookies', function(cookies)");
    console.log('update-cookies data recieved::' + JSON.stringify(cookies));
    models.Cookie.findOne({
        where: {
          uid: cookies.uid
        }
      })
      .then((foundCookie) => {
        
        if (foundCookie) {
          foundCookie.key = cookies.key;
          foundCookie.save()
            .then(() => {
              console.log('sending updated cookie data to client');
              socket.emit('cookies-updated');
            })
        } else {
          console.error('cookie not updated');
        }
      });
  });

  socket.on('teacher-details', function(id) {
    console.log("socket.on('teacher-details', function(id)");
    console.log('logging teacher id::' + id);
    connectionInfo['teacherId'] = id;
    //  var teacherDetails = 'SELECT * FROM users WHERE id=?'; connection.query(teacherDetails, [id], function(error, results)
    models.User.findOne({
      where: {
        id: id
      }
    }).then(function(results) {
      console.log(JSON.stringify(results));


      var details = {
        username: results.name,
        uid: results.id
      }
      console.log('teacher-details:: on cookie match :' + JSON.stringify(details));
      //<sarang> getClasses(connectionInfo, socket);

      socket.emit('teacher-details-done', details);
    });
  });

  socket.on('student-details', function(id) {
    console.log("socket.on('student-details', function(id)");
    console.log('logging student id::' + id);
    //connectionInfo['teacherId'] = id;
    //  var teacherDetails = 'SELECT * FROM users WHERE id=?'; connection.query(teacherDetails, [id], function(error, results)
    models.User.findOne({
      where: {
        id: id
      }
    }).then(function(results) {
      console.log(JSON.stringify(results));


      var details = {
        username: results.name,
        uid: results.id
      }
      console.log('student-details:: on cookie match :' + JSON.stringify(details));
      //<sarang> getClasses(connectionInfo, socket);

      socket.emit('student-details-done', details);
    });
  });



  /**
   * when the teacher creates a new class
   */
  socket.on('create-class', function(name, number, userId) {
    console.log("socket.on('create-class', function(name, number, userId)");

    // var newClassQuery = 'insert into critisearch_groups(name, owner) values (?, ?)';
    // create a group , 
    //generate sillynames for students, 
    //add to user table and 
    //add students to membership
    console.log("creating class::" + "name::" + name + "number::" + number + "userId::" + userId);
    models.Group.create({
      name: name,
      ownerId: userId
    })
      .then(function(newGroup) {
        //add teacher to the membership, 
        console.log('Logging::newGroup created with id', newGroup.id);

        //   var teacherRole = 'insert into critisearch_role_memberships (uid, role_id, gid) values (?, ?, ?)';
        var teacherMembership = models.Membership.create({
          groupId: newGroup.id,
          userId: userId
        });
        var studentNames = getNames(number);

        // studentNames.unshift(teacherMembership);

        // <to do> add an entry in membership and then call the get names 
        Promise.all(studentNames)
          .then(function(studentResults) {
            // console.log(studentResults);
            return Promise.all(studentResults.map(function (student) {
              return models.Membership.create({
                groupId: newGroup.id,
                userId: student.id
              });
            }))
            .then(function () {
              socket.emit('class-created', name, newGroup.id, studentResults);

            });
          });

      });
    // connection.query(newClassQuery, [name, connectionInfo.teacherId], function(error, results) {
    //   console.log("create class");
    //   console.log(results);
    //   var groupId = results.insertId;

    //   connection.query(teacherRole, [connectionInfo.teacherId, 1, groupId], function(error, results) {});



    // async.parallel(getNames(number, groupId), function(error, results) {
    //   if (error) {
    //   console.log(error);
    //   } else if (results) {
    //   console.log("result being logged");
    //   console.log(results);
    //   socket.emit('class-created', name, groupId, results);
    //   }
    // });

    //   //return the names list toat goes with this class

    // });
  });

  socket.on('delete-class', function(id) {
    console.log("socket.on('delete-class', function(id)");
    console.log("Deleting class " + id);
    var deleteQuery = 'DELETE FROM critisearch_role_memberships WHERE gid=?;';
    connection.query(deleteQuery, [id], function(error, results) {});
    deleteQuery = 'DELETE FROM critisearch_groups WHERE gid=?;';
    connection.query(deleteQuery, [id], function(error, results) {
      socket.emit('class-deleted', id);
    });
  });


  // <Next To Do> when new students are added for each student create a membership association and pass on to the client side
  socket.on('add-students', function(classId, number) {
    conole.log("socket.on('add-students', function(classId, number)");
  var addedStudents =  getNames(number, classId, connectionInfo.teacherId)
    Promise.all(addedStudents)
          .then(function(studentResults) {
             console.log('Logging studentResults::' + studentResults);
            return Promise.all(studentResults.map(function (student) {
              return models.Membership.create({
                groupId: classId,
                userId: student.id
              });
            }))
            .then(function () {
              console.log('Sending data::' + studentResults + 'Group::' + classId);
              socket.emit('students-added', studentResults, classId);
            });
          });
  });


  // Login student code
  socket.on('login-student', function(details) {
    console.log("socket.on('login-student', function(details)");
    console.log('Searching for ' + details.sillyname);

    var newUser = models.User.findAll({
      where: {
        name: details.sillyname
      }
    }).then(function(results) {
      if (results.length > 0) {
        results[0].success = false;
        console.log("Looking for " + results[0].name);
        if (details.sillyname == results[0].name) {
          results[0].success = true;
          console.log("User match");
        }

        var user = results[0];

        //var findGroup = 'select * from critisearch_role_memberships where uid=?';
        // connection.query(findGroup, [user.id], function(error, results) {

        var findGroup = models.Membership.findAll({
          where: {
            userId: [user.id]
          }
        }).then(function(results) {

          if (results.length > 0) {
            // user.groupId = results[0].groupId;

            socket.join(user.groupId);
              console.log('Logging user on student login::' + user);
              var cookiekey = getKey();
              console.log('cookie has key::' + cookiekey);
                  models.Cookie.findOrCreate({
                    where: {
                        uid: user.id,
                        
                    },
                    defaults:{
                      key: cookiekey
                    }
              }).spread(function(cookie){
                  console.log('we got here');
                  var studentObj = {
                    id: user.id,
                    name: user.name,
                    groupId: results[0].groupId,
                    cookiekey: cookiekey
                  };
                  io.to(studentObj.groupId).emit('login-student-alert', studentObj)
                  socket.emit('login-student-done', studentObj);
                  models.Client.findOne({
                    where: {
                      socketid: socket.id
                    }
                  }).then(function(client) {
                    client.userId = user.id;
                    client.save();
                  });
              }).catch(function(err){
                console.log('Error::' + JSON.stringify(err));
              });
              
          } else { //this is for if the user DNE
            socket.emit('login-student-done', {
              success: false,
              message: 'incorrect username.'
            });
          }
        });
      }
    }).catch(function(err) {
      console.log(err);
    });
  });


  // <Sarang m1> 

  socket.on('teacher', function(groupId) {
    console.log("socket.on('teacher', function(groupId)");
    console.log('Teacher Joined', groupId);
    socket.join(groupId);
    
    // get the most recent results if the tecaher wasnt logged in for some reason or if the teacher closed the tab and joined again
    // var oldResults = 'SELECT q.query FROM critisearch_queries q ' +
    //   'join critisearch_role_memberships m on m.uid=q.searcher ' +
    //   'where m.gid=? and time > date_sub(now(),INTERVAL 90 MINUTE) order by time desc;';
    // connection.query(oldResults, [groupId], function(error, results) {
    //   socket.emit('oldQueries', results);
    // });
  });

  socket.on('info-for-server', function(msg) {
    console.log("socket.on('info-for-server', function(msg)");
    console.log(msg.data);
  });



  // When a user promotes a query an event is logged in the event table with the query details, client details and the query result which was voted up 
  socket.on('promoted', function(result) {
    console.log("socket.on('promoted', function(result)");
    models.Result.findById(result.id)
      .then(function(foundResult) {
        models.Client.findOne({
          where: {
            socketid: socket.id
          }
        }).then(function(client) {
          models.Event.create({
            description: JSON.stringify('client with id :: ' + client.id + ' voted down the result :: ' + foundResult.title + ' for ' + foundResult.title),
            type: models.EVENT_TYPE.VOTE_UP,
            queryId: foundResult.queryId,
            clientId: client.id,
            resultId: foundResult.id
          });
        });
      });

  });

  // When a user promotes a query an event is logged in the event table with the query details, client details and the query result which was voted down
  socket.on('demoted', function(result) {
    console.log("socket.on('demoted', function(result)");

    models.Result.findById(result.id)
      .then(function(foundResult) {        
        models.Client.findOne({
          where: {
            socketid: socket.id
          }
        }).then(function(client) {
          models.Event.create({
            description: JSON.stringify('client with id :: ' + client.id + ' voted down the result :: ' + foundResult.title + ' for ' + foundResult.title),
            type: models.EVENT_TYPE.VOTE_DOWN,
            queryId: foundResult.queryId,
            clientId: client.id,
            resultId: foundResult.id
          });
        });
      });
  });

  socket.on('follow', function(result) {
    console.log("socket.on('follow', function(result)");

    models.Result.findById(result.id)
      .then(function(foundResult) {
        console.log('changing link_visited to true');
        foundResult.link_visited = true;
        foundResult.save();
        models.Client.findOne({
          where: {
            socketid: socket.id
          }
        }).then(function(client) {
          models.Event.create({
            description: JSON.stringify('client with id :: ' + client.id + ' followed the link for ' + foundResult.title),
            type: models.EVENT_TYPE.FOLLOW,
            queryId: foundResult.queryId,
            clientId: client.id,
            resultId: foundResult.id
          });
        });
      });
      // scholar.search(result.query)
      // .then(scholarResultsCallback(socket){
      //   console.log(socket);
      // });
  });

  socket.on('log-out-class', function(classId) {
    console.log("socket.on('log-out-class', function(classId)");
    socket.broadcast.to(classId).emit('logout');
    console.log('log out the entire class: ' + classId);
  })


  /**
   * When the user searchesfor more results. First identify the query and client from the socket id, then load more results
   */

  socket.on('load-more-results', function(data) {
    console.log("socket.on('load-more-results', function(data)");
 
    
    // create an event in the database when the user requuests for more results
    models.Client.findOne({
        where: {
          socketid: socket.id
        }
      }).then(function(client) {
        models.Event.create({
          description: JSON.stringify('client with id :: ' + client.id + ' requested more results '),
          type: models.EVENT_TYPE.MORE_RESULTS,
          clientId: client.id,
          queryId: responsesForClient[socket.id].query.id
        });
      });
   
    
    console.log('fetching more results for socketid::' + socket.id);
    console.log('fetching more results for uid::' + data.user);
    if (data.searchScholar) {
      if(responsesForClient &&
        responsesForClient.hasOwnProperty(socket.id) &&
        responsesForClient[socket.id].hasOwnProperty('response')&&
        responsesForClient[socket.id].response.next) {
      
        responsesForClient[socket.id].response.next()
          .then(scholarResultsCallback(socket));
      }
    } else {
      if(responsesForClient &&
        responsesForClient.hasOwnProperty(socket.id) &&
        responsesForClient[socket.id].hasOwnProperty('response')&&
        responsesForClient[socket.id].response.next) {
      
        responsesForClient[socket.id].response.next();
      }
    }
  });

    

  // When the user searches for the first time
  socket.on('q', function(details) {
      console.log("socket.on('q', function(details)");
      responsesForClient[socket.id] = {
        nextIndex: 0
      };
    console.log('details.searchScholar:' + details.searchScholar);      
    // create query in the database and log group details if any
    var createdQuery = models.Query.create({
      text: details.query,
    }).then(function(query) {
      responsesForClient[socket.id].query = query;
      if (details.hasOwnProperty('userId')) {
        console.log("Loggin Group details: " + details);
        // socket.broadcast.to(details.group.id).emit('query', details.query);
        console.log("Group: " + details.group.id);
        console.log('broadcasting to room', details.group.id);
        socket.broadcast.to(details.group.id).emit('query', details.query);
        models.Membership.findOne({
          where: {
            userId: details.userId,
            groupId: details.group.id
          }
        }).then(function(foundMembership) {
          // console.log(foundMembership)
          query.authorId = foundMembership.id;
          query.save();
        });
      }

      var didScholarSearch = '';  // use this to change the event message when
                                  // scholar search was performed

      if (details.searchScholar) {
        didScholarSearch = 'scholar-';
      }                                  

      // Create an event for the client who fires the query
      models.Client.findOne({
        where: {
          socketid: socket.id
        }
      }).then(function(client) {
        models.Event.create({
          description: JSON.stringify('client with id :: ' + client.id + ' ' +
            didScholarSearch + 'searched the link for ' + query.text),
          type: models.EVENT_TYPE.SEARCH,
          clientId: client.id,
          queryId: query.id
        });
      });

          
      if (details.searchScholar) {
        console.log('search scholar')
        scholar.search(details.query)
        .then(scholarResultsCallback(socket));
      }
      else {
        console.log('search google')
        google(details.query, function(err, response) {
          if (err) {
            console.log(err)
          } else {
            // console.log(response);
            
            var processedResults = getProcessedResults(response.links);
            responsesForClient[socket.id].response = response;
            var incrementIndex = responsesForClient[socket.id].nextIndex;
            var arrayOfPromisesForEachCreatedResultInSequelize = processedResults.map(function(result, idx) {
              
              return models.Result.create({
                link: result.link,
                description: result.description,
                result_order: idx + incrementIndex,
                title: result.title,
                result_relevance: models.RELEVANCE.VOTE_NONE,
                queryId: query.id,
                link_visited: false
              });
            });
            responsesForClient[socket.id].nextIndex +=processedResults.length
            Promise.all(arrayOfPromisesForEachCreatedResultInSequelize)
              .then(function(sequelizeResults) {
                socket.emit('search-results', sequelizeResults);
              });          
          } // end of else for no error 
          
        });
      }   // end of lse block for details.searchScholar  
    }).catch(function(err) {
      console.log(err);
    });
  });



  socket.on('critisort', function(uid) {
    console.log("socket.on('critisort', function(uid)");
    var details = 'user sorted the list';
    models.Event.create({
      description: JSON.stringify(details),
      type: models.EVENT_TYPE.CRITISORT
    });

    // var newEvent = 'insert into critisearch_events (type, time, client, query) values (?, ?, ?, ?)';
    // if (uid == '') {
    //   connection.query(newEvent, [5, new Date(), connectionInfo.dbId, connectionInfo.currentQuery], function(error, results) {});
    // } else {
    //   connection.query(newEvent, [5, new Date(), uid, connectionInfo.currentQuery], function(error, results) {});
    // }
  });
});

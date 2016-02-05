'use strict';

var Sequelize = require('sequelize');
var sequelize = new Sequelize(
  process.env.CS_DB, // database name
  process.env.CS_USER, // username
  process.env.CS_PASS, // password
  { logging: function () {} }
);

var DROPTABLES = false;


if (process.env.CS_DROP === 'true') {
  DROPTABLES = true;
}


var Result = sequelize.define('result', {
  link: Sequelize.STRING(2048), 
  description: Sequelize.TEXT, 
  result_order: Sequelize.FLOAT(5,2), 
  title: Sequelize.STRING,
});

var Client = sequelize.define('client', {
  socketid: Sequelize.STRING,
  connected: Sequelize.DATE,
  disconnected: Sequelize.DATE,
});

var Cookie = sequelize.define('cookie', {
  key: Sequelize.STRING,
  uid: Sequelize.STRING,
});

let ROLES = {
  PARTICIPANT: 'participant',
  FACILITATOR: 'facilitator'
},

var User = sequelize.define('user', {
  name: {type: Sequelize.STRING, unique: true},
  password: Sequelize.STRING,
  email: Sequelize.STRING,
  role: Sequelize.ENUM(
    ROLES.facilitator,
    ROLES.participant)
});

var Query = sequelize.define('query', {
  text: Sequelize.STRING,
});

Result.belongsTo(Query);

var Group = sequelize.define('group', {
  name: Sequelize.STRING,
});

var Membership = sequelize.define('membership', {
});

// these area all sequelize fns
// http://docs.sequelizejs.com/en/latest/docs/associations/#belongs-to-many-associations
User.belongsToMany(Group, {through: 'Membership'});
Group.belongsToMany(User, {through: 'Membership'});

// User.hasMany(Query, {through: 'Membership'});  //will this work
Query.belongsTo(Membership, {as: 'author'});

exports.ROLES = ROLES;
exports.Result = Result;
exports.Client = Client;
exports.Cookie = Cookie;
exports.User = User;
exports.Query = Query;
exports.Group = Group;
exports.Membership = Membership;

exports.start = function () {
  return sequelize.sync({force: DROPTABLES})  // Use {force:true} only for updating the above models,
                                              // it drops all current data
    .then( function (results) {
      //create a new user as a faciliatator with username admin
      return User.findOrCreate({
        where: {
          email: 'teacher@critisearch.org',
          name: 'teacher',
          password: '8d788385431273d11e8b43bb78f3aa41', // md5 hash of test
          role: 'facilitator'
        } 
      })
        .spread(function (userResults) {
          // create a new group ("class") with name My Test Group
          return Group.findOrCreate({
            where: {
              name: 'TestClass',
              // ownerId: userResults[0].dataValues.id,
            } 
          })
            .spread(function (groupResults) {
              
              return Promise.all([
                Membership.findOrCreate({
                  where: {
                    groupId: groupResults.id,
                    userId: userResults.id,
                  }
                }),

                User.findOrCreate({
                  where: {
                    email: 'sillyname@critisearch.org',
                    name: 'sillyname',
                    password:'44e8cca84eae7121a2d48cb52bfc0ad5',
                    role: 'participant'
                  }
                })
                  .spread(function (studentResults) {
                    return Membership.findOrCreate({
                      where: {
                        groupId: groupResults.id,
                        userId: studentResults.id,
                      }
                    });
                  })
              ]);
            });
        });
    })
    .then( function () {
      if (DROPTABLES) {
        console.log('Testing: All Table Data Dropped');
      }
      console.info('Tables Synced');
      return true;
    })
    .catch(function (error) {
      console.error(error);
    });
  
};
var Promise = require('promise');
var GitHubApi = require('github');
var fs = require('fs');

var github = new GitHubApi({
  version: '3.0.0',
  debug: true
});

function getUsersByLocation(location, limit) {
  var users = [];
  return new Promise(function (resolve, reject) {
    github.search.users({
      q: 'location:' + location
    }, function recvUsers(err, res) {
      if (err) {
        reject(err);
      }

      res.items
        .slice(0, limit - users.length)
        .forEach(function (user) {
          users.push(user.login);
          console.log(users.length, user.login);
        });

      if (users.length >= limit || !github.hasNextPage(res)) {
        resolve(users);
      } else {
        github.getNextPage(res, recvUsers);
      }
    });
  });
}

getUsersByLocation('Singapore', 50)
  .then(function (users) {
    console.log('Got:', users);
    fs.writeFile('users.json', JSON.stringify(users, null, 2), function (err) {
      if(err) {
        console.log(err);
      } else {
        console.log('JSON saved');
      }
    });
  })
  .catch(function (err) {
    console.error(err);
  });

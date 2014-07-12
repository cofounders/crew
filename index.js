var Promise = require('promise');
var GitHubApi = require('github');
var fs = require('fs');

var github = new GitHubApi({
  version: '3.0.0',
  debug: false
});

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  github.authenticate({
      type: 'oauth',
      key: process.env.GITHUB_CLIENT_ID,
      secret: process.env.GITHUB_CLIENT_SECRET
  });
}

function fetch(method, args, limit) {
  return new Promise(function (resolve, reject) {
    var items = [];
    method(args, function recv(err, res) {
      if (err) {
        if (err.code === 403) {
          console.log('Rate limited');
          setTimeout(function () {
            console.log('Retrying');
            method(args, recv);
          }, 60000);
        } else {
          reject(err);
        }
        return;
      }
      res.items
        .slice(0, limit - items.length)
        .forEach(function (item) {
          items.push(item);
          console.log(items.length, item);
        });
      if (items.length >= limit || !github.hasNextPage(res)) {
        resolve(items);
      } else {
        github.getNextPage(res, recv);
      }
    });
  });
}

fetch(github.search.users, {
  q: 'location:' + 'Singapore'
}, 50)
  .then(function (users) {
    console.log('Got:', users);
    fs.writeFile('users.json', JSON.stringify(users, null, 2), function (err) {
      if(err) {
        console.log(err);
      } else {
        console.log('JSON saved');
      }
    });
    return users;
  })
  .then(function (users) {
    return Promise.all(
      users.map(function (user) {
        return fetch(github.search.issues, {
          q: 'type:pr+state:closed+author:' + user
        }, 5)
      })
    );
  })
  .then(function (issues) {
    console.log('Got:', issues);
    fs.writeFile('issues.json', JSON.stringify(issues, null, 2), function (err) {
      if(err) {
        console.log(err);
      } else {
        console.log('JSON saved');
      }
    });
    return issues;
  })
  .catch(function (err) {
    console.error(err);
  });

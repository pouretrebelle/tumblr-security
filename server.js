'use strict';

var express = require('express');
var fs = require('fs');
var nodemailer = require('nodemailer');
var cors = require('cors');

var fileroot = 'https://pouretrebelle-security.herokuapp.com';

// setup server
var app = express();
app.use(cors());


// health check
var healthcheck = {
  version: require('./package').version,
  http: 'okay'
};
// healthcheck info public
app.get(['/healthcheck'], function(req, res) {
  res.jsonp(healthcheck);
});


function addLoaded(id, username) {
  if (loaded[id] != null) {
    // id exists
    var found = false;
    for (var i = 0; i < loaded[id].length; i++) {
      if (loaded[id][i][0] == username) {
        // id and name exists
        loaded[id][i][1]++;
        found = true;
      }
    };
    if (found == false) {
      // for id but not name
      loaded[id].push([username, 1]);
    };
  } else {
    // for no id
    loaded[id] = [[username, 1]];
  }
};
function clearLoaded() {
  loaded = {};
}




function getBanned() {
  banned = JSON.parse(fs.readFileSync('banned.json', 'utf8'));
};
function saveBanned() {
  fs.writeFile('banned.json', JSON.stringify(banned), 'utf8');
};
function addBanned(name) {
  banned.push(name);
};
function removeBanned(name) {
  var i = banned.indexOf(name);
  if (i > -1) {
    banned.splice(i, 1);
  }
};
function checkBanned(id) {
  return (banned.indexOf(id) > -1 ? true : false);
};


function checkCheating() {
  var problems = [];
  for (var id in loaded) {
    if (loaded[id].length > 1) {
      var usernameprobs = 0;
      for (var i = 0; i < loaded[id].length; i++) {
        if (loaded[id][i][1] > 10) {
          usernameprobs++;
        }
      }
      if (usernameprobs > 1) {
        problems.push(id);
      }
    }
  }
  if (problems.length == 0) problems = false;
  return problems;
};
function stringCheating(cheating) {
  var cheathtml = '';
  for (var i = 0; i < cheating.length; i++) {
    var id = cheating[i];
    for (var i = 0; i < loaded[id].length; i++) {
      var user = loaded[id][i];
      cheathtml += '<p>'+user[1]+' - <a href="http://'+user[0]+'.tumblr.com/">'+user[0]+'</a></p>';
    };
    cheathtml += '<p><a href="'+fileroot+'/ban?id='+id+'&key='+key+'">ban this purchase</a></p><br /><br />';
  };
  return cheathtml;
}
function sendCheating() {
  var cheating = checkCheating();
  var cheathtml = '';
  console.log(cheating);
  if (cheating != false) {
    cheathtml = stringCheating(cheating);
    mailOptions.html = cheathtml;
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Message sent: ' + info.response);
      }
    });
  }
};



// mail setup
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'ask@pouretrebelle.com',
    pass: 'Mol!e5726'
  }
});
var mailOptions = {
  from: 'Charlotte <themes@pouretrebelle.com>', // sender address
  to: 'themes@pouretrebelle.com', // list of receivers
  subject: 'Security Alert', // Subject line
  text: 'Hello world ✔', // plaintext body
  html: '<b>Hello world ✔</b>' // html body
};




var banned = [];
var loaded = {};
var key = 'lIab71ksD10nsfuh712Vosny';
getBanned();



function security(req, res, next) {
  if (!req.query.id || !req.query.username) {
    res.send(req.query);
  }
  if (checkBanned(req.query.id)) {
    res.send(false);
  } else {
    addLoaded(req.query.id, req.query.username);
    res.send(true);
  }
};


function ban(req, res, next) {
  if (req.query.key == key) {
    addBanned(req.query.id);
    saveBanned();
    res.send('you\'ve successfully banned '+req.query.id);
  } else {
    res.send('not authenticated');
  }
};
function unban(req, res, next) {
  if (req.query.key == key) {
    removeBanned(req.query.id);
    saveBanned();
    res.send('you\'ve successfully unbanned '+req.query.id);
  } else {
    res.send('not authenticated');
  }
};


function bannedroute(req, res, next) {
  res.set('Content-Type', 'text/json');
  getBanned();
  res.send(banned);;
};
function loadedroute(req, res, next) {
  res.set('Content-Type', 'text/json');
  res.send(loaded);;
};
function cheatingroute(req, res, next) {
  var cheating = checkCheating();
  sendCheating();
  if (cheating != false) {
    res.send(stringCheating(cheating));
  } else {
    res.set('Content-Type', 'text/json');
    res.send(loaded);;
  }
};


// every hour
setInterval(function() {
  saveBanned();
}, 60*60);

// every day
setInterval(function() {
  sendCheating();
  clearLoaded();
}, 1000*60*60*24);





// deal w/ the routing
app.route('/ban').get(ban);
app.route('/unban').get(unban);
app.route('/banned').get(bannedroute);
app.route('/loaded').get(loadedroute);
app.route('/cheating').get(cheatingroute);

app.route('/').post(security)
              .get(security);



var server = app.listen(process.env.PORT || 2000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});

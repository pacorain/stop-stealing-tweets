var TwitterWrapper = require('./lib/TwitterWrapper');
var auth = require('./config/auth.json').twitter;
var accounts = require('./config/accounts.json');

var twitter = new TwitterWrapper(auth);
var stream;

setUpStream();

function setUpStream() {
  console.log("INDEX: Setting up stream.")
  twitter.watchUsers(accounts).progress(function (twitterStream) {
    stream = twitterStream;
    stream.on('tweet', function(tweet) {
      checkIfStolen(tweet);
    });
    stream.on('error', function(err) {
      console.err(err);
    });
  }).then(function(error) {console.log("test" + error)});
}

function checkIfStolen(tweet) {
  console.log(tweet.user.screen_name + " tweeted: " + tweet.text);
}
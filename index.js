var TwitterWrapper = require('./lib/TwitterWrapper');
var StolenTweetDetector = require('./lib/StolenTweetDetector');
var auth = require('./config/auth.json').twitter;
var accounts = require('./config/accounts.json');


var twitter = new TwitterWrapper(require('./config/auth.json').twitter);
var detector = new StolenTweetDetector(twitter);
var stream;

setUpStream();

function setUpStream() {
  console.log("INDEX: Setting up stream.")
  twitter.watchUsers(accounts).progress(function (twitterStream) {
    stream = twitterStream;
    stream.on('tweet', function(tweet) {
      checkIfStolen(tweet);
    });
    stream.on('error', function(error) {
      console.error(error);
    });
  }).fail(console.log);
}

function checkIfStolen(tweet) {
  console.log(tweet.user.screen_name + " tweeted, testing if stolen.");
  if (detector.mediaIsStolen(tweet)) {
    console.log("test");
    detector.getMediaOwner(tweet).then(function (user) { 
      console.log("Media was stolen from @" + user.screen_name + ".");
    });
  } else if (tweetTextOriginatedElsewhere(tweet)) {
    // TODO
  } else {
    console.log("Could not detect that the tweet was stolen.");
  }
}

function tweetTextOriginatedElsewhere(tweet) {
  return false;
}
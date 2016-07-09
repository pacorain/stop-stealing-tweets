var config = require('../config/detection.json');
var StolenStatus = require('../lib/StolenStatus');
var NL = require('../lib/NL');
var Q = require('q');
var bigInt = require('big-integer');

function StolenTweetDetector(stolen, twitterWrapper) {
    if (!(this instanceof StolenTweetDetector)) return new StolenTweetDetector(stolen, twitterWrapper);
    this._twitter = twitterWrapper;
    this.stolen = stolen;
    this.origin = null;
    this.confidence = 0.0;
    this.status = StolenStatus.NONE;
}

StolenTweetDetector.prototype.findOrigin = function () {
    var tests = [this.findOriginMedia, this.findOriginText];
    var result = Q(null);
    tests.forEach(function (test) {
        result = result.then(test.bind(this));
    }.bind(this));
    return result;
};

StolenTweetDetector.prototype.findOriginMedia = function () {
    var media = this.stolen.entities.media;
    if (this.isConfident()) {
        console.log("DETECTOR: Skipping media detection: already detected stolen tweet.");
    } else if (!media) {
        console.log("DETECTOR: Tweet does not contain any media.");
    } else if (!media[0].source_user_id_str) {
        console.log("DETECTOR: Tweet contains media, but no owner information available.");
    } else {
        return this._twitter.getTweetById(media[0].source_status_id_str)
            .then(function (origin) {
                if (origin.user.screen_name != this.stolen.user.screen_name) {
                    this.origin = origin;
                    this.confidence = 1;
                    this.status = StolenStatus.RELINKED_MEDIA;
                    return origin;
                } else {
                    console.log("DETECTOR: Media originated from same user.")
                }
            }.bind(this));
    }
};

StolenTweetDetector.prototype.findOriginText = function () {
    var max_id = this.stolen.id_str;
    var twitter = this._twitter;
    console.log("DETECTOR: Searching for matches older than tweet ID " + max_id + ".");
    return this._searchForMinIdTweet(this.stolen.text, max_id).then(function (minId) {
        if (minId != max_id)
            return twitter.getTweetById(minId).then(function (tweet) {
                this.origin = tweet;
                this.confidence = 1;
                this.status = StolenStatus.COPIED_TEXT;
                return tweet;
            }.bind(this));
        else return null;
    }.bind(this));
};

StolenTweetDetector.prototype._searchForMinIdTweet = function(text, max_id) {
    var instance = this;
    return this._twitter.search('"' + text + '"', {max_id: max_id})
        .then(function(results) {
            return getLowestTweetId(results.statuses, max_id);
        }).then(function (minId) {
            if (bigInt(max_id).compare(minId) !== 0) {
                console.log("DETECTOR: Older tweet found, ID " + minId);
                return instance._searchForMinIdTweet(text, minId.toString());
            }
            else {
                console.log("DETECTOR: No older tweets found.");
                return minId.toString();
            }
        });
};

function getLowestTweetId(tweets, max_id) {
    var min = bigInt(max_id);
    tweets.forEach(function(tweet) {
        if (bigInt(tweet.id_str).compare(min) < 0) {
            min = bigInt(tweet.id_str);
        }
    });
    return min;
}

StolenTweetDetector.prototype.isConfident = function() {
    return this.confidence >= config.confidenceThreshold;
};

StolenTweetDetector.prototype.getStolen = function() {
    return this.stolen;
};

StolenTweetDetector.prototype.getOrigin = function() {
    return this.origin;
};

StolenTweetDetector.prototype.getStatus = function() {
    return this.status;
};

StolenTweetDetector.prototype.getConfidence = function() {
    return this.confidence;
};

module.exports = StolenTweetDetector;
'use strict';

var app = {};

// API keys
app.lcboApiKey = lcboApiKey;

app.init = function() {
	// stuff
	console.log('api key >>>', app.lcboApiKey);
};

// Start the app
$(function() {
	app.init();
});
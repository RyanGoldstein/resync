resync
======

Call a callback when all of your callbacks have been called back!

Installation
------------

``
> npm install resync
``

Usage
-----

```javascript
var Resync = require("resync");

var options = {
	callback: function(err, data) {},  //Required callback function to execute upon completion of all registered callbacks
	timeout: 0,                        //Timeout to wait for all functions to be called back (0 = wait forever)
	ignoreErrors: false,               //Do not trigger callback on first error
	wait: 1                            //How many milliseconds to wait for callbacks to be created 
};

var timeout = 0;

function complete(err, data) {
	if(err) {
		console.error(err.message);
	} else {
		console.log("All of the callbacks have been completed");
		//data.time = HR time elapsed since Resync instantiation
		//data.result = {0: "writeFile", "named callback": "httpGet", 2: "sigint"}
	}
}

var wait = new Resync(options);
// or new Resync([timeout, ]complete[, options]);

fs.writeFile("/tmp/writeFile" + e, e, wait.callback(function(err) { 
	console.log("Finished writing file");
	return "writeFile";
}));
http.get("http://www.github.com/RyanGoldstein/resync", wait.callback("named callback", function(res) { 
	console.log("Finished writing file"); 
	return "httpGet";
}));
process.on("SIGINT", wait.callback(function() { 
	console.log("Exiting application"); 
	return "sigint";
}));

//Optional start() method, otherwise it will automatically wait 1 millisecond for all callbacks to be bound
wait.start()
```

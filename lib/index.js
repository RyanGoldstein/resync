/*
    resync for Node.js
    Copyright (C) 2014 Ryan Goldstein

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
var EventEmitter = require('events').EventEmitter;

function result(self) {
	return {
		result: self.result, 
		time: process.hrtime(self.start)
	};
}

function resyncCallback(self, name, fn, pArgs) {
	var res = null, 
		args = Array.prototype.slice.call(pArgs),
		index = self.sync.indexOf(pArgs.callee);
	if(index > -1) { 
		self.sync.splice(index, 1); 
		if(typeof fn == 'function') {
			try {
				self.result[name] = fn.apply(this, args);
			} catch(err) {
				if(!args[0]) {
					args[0] = err;
				}
			}
		} else {
			self.result[name] = fn;
		}
	} 
	if(!self.waitTimeout && !self.error && (!self.sync.length || (!self.options.ignoreError && args[0] instanceof Error))) {
  	delete pArgs.callee.or;
		res = done(self, args[0]);
	}
	return res;
};

function done(self, err) {
	if(self.completed) {
		throw new Error("This Resync has already been used");
	}
	self.completed = true;
	var res = result(self);
	if(self.timeout) {
		clearTimeout(self.timeout);
	}
	if(err) {
		self.emit("error", err, res);
	}
	self.emit("complete", err, res);
	return res;
}

function start(self) {
	if(self.waitTimeout) {
		clearTimeout(self.waitTimeout);
		delete self.waitTimeout;
	}
	if(EventEmitter.listenerCount(this, "complete")) {
		throw new Error("No callback function specified");
	}
	if(self.sync.length) { 
		if(self.options.timeout) { 
			self.timeout = setTimeout(function() { 
				var err = new Error("Timed out after " + self.options.timeout + "ms");
				self.emit("timeout", err, result(self));
				self.emit("error", err, result(self));
				self.emit("complete", err, result(self));
			}, self.options.timeout); 
		}
	} else { 
		return done(self, null);
	}
}

var Resync = module.exports = function Resync() {
	var self = this;
	this.sync = [];
	this.result = {};
	this.options = {};
	this.start = process.hrtime();
	this.error = false;

	switch(typeof arguments[0]) {
		case 'number':
			if(typeof arguments[1] == 'object') {
				this.options = arguments[1];
			}
			this.options.timeout = arguments[0];
			if(typeof arguments[1] == 'function') {
  			this.on('complete', arguments[1]);
			}
			break;
		case 'function':
			if(typeof arguments[1] == 'object') {
				this.options = arguments[1];
			}
				this.on('complete', arguments[0]);
			if(typeof arguments[1] == 'number') {
				this.options.timeout = arguments[1];
			}
			break;
		case 'object':
			this.options = arguments[0];
			if(typeof arguments[1] == 'function') {
				this.on('complete', arguments[1]);
			} else if(typeof arguments[1] == 'number') {
				this.options.timeout = arguments[1];
			}
			break;
		default:
			throw new Error("Wrong number or type of arguments");
			break;
	}
	this.options.wait = this.options.wait || 1;
	this.options.ignoreError = this.options.ignoreError || false;
	
	this.waitTimeout = setTimeout(function() { 
		start(self); 
	}, this.options.wait);
}

require('util').inherits(Resync, EventEmitter);

Resync.prototype.callback = function callback(name, fn) {
	var self = this;
	if(typeof name == 'function') {
		fn = name;
		name = this.sync.length;
	}
	function resyncCallbackWrapper() { 
		return resyncCallback.call(this, self, name, fn, arguments); 
	}
	resyncCallbackWrapper.or = resyncCallbackWrapper;
	this.sync.push(resyncCallbackWrapper);
	return resyncCallbackWrapper;
}

Resync.prototype.start = function start() {
	start(this);
}


var express = require('express');
var relaxful = require('relaxful');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var port = 80;
var SOCKET_SERVER_URL;
var apiServer;

// returns api server object
module.exports.getServer = function() {
	return apiServer;
}

// creates a server
module.exports.createServer = function(options) {
	if(options) {
		if(options.port && !isNaN(options.port)) {
			port = options.port;
		}

		if(options.ssl) {
			var https = require('https');
			apiServer = https.createServer(options,app);
			apiServer.listen(port);
		} else { // http
			var http = require('http');
			apiServer = http.createServer(app);
			apiServer.listen(port);
		}

		if(options.socket_server_url) {
			SOCKET_SERVER_URL = options.socket_server_url;
		}
	}

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	var mongoose = require('mongoose');
	mongoose.Promise = global.Promise;
	mongoose.connect('mongodb://localhost/lights'); 

	var Light = require('./models/Light');

	var router = express.Router();

	app.use(function(req, res, next) {
		next();
	});

	router.get('/', function(req, res) {
		res.json({ message: "Lights API"});
	});

	router.route('/lights')
		.post(function(req, res) {
			console.log(req.body.name);
			if(req.body.name && req.body.channel) {
				var light = new Light();
				var state = false;

				if(req.body.state) {
					state = req.body.state;
				}

				light.name = req.body.name.toLowerCase();
				light.state = state;
				light.channel = req.body.channel;

				light.save(function(err) {
					if(err) {
						res.send(err);
					} else {
	  					relaxful.request('POST',SOCKET_SERVER_URL,{body:'data='+JSON.stringify(light),headers: {'Content-Type':'application/x-www-form-urlencoded'}});
						res.json(light);
					}
				});
			} else {
				res.send(new Error);
			}
		})

		.get(function(req, res) {
			Light.find({}).sort({"name":1 }).exec(function(err, lights) {
				if(err)
					res.send(err);

				if(lights != null) {
					res.json(lights);
				} else {
					res.send({message: "error"});
				}
			});
	});

	router.route('/lights/name/:light_name')
		.get(function(req, res) {
			Light.findOne({ name:req.params.light_name}, function(err, light) {
				if(err)
					res.send(err)

				if(light != null) {
					res.json(light)
				}
			});
		})

		.put(function(req, res) {
			var name = req.params.light_name.toLowerCase();
	        Light.findOne({name:name}, function(err, light) {
	            if(err)
	                res.send(err)

				if (light != null) {
		            if(req.body.name) {
		                light.name = req.body.name.toLowerCase();
		            } else {
		                light.name = light.name;
		            }

	           		if(req.body.state) {
						if(req.body.state != 'true' && req.body.state != 'false') {
							light.state = 'false';
						} else {
				            light.state = req.body.state;
				        }
					}

	            	if(req.body.channel) {
						light.channel = req.body.channel;
		    		}

	            	light.save(function(err) {
	               		if(err) {
	                    	res.send(err)
						} else {
							relaxful.request('POST',SOCKET_SERVER_URL,{body:'data='+JSON.stringify(light),headers: {'Content-Type':'application/x-www-form-urlencoded'}}).promise.then(r => {
							return r.validate();
						}).then(r => {
							console.log(r.text);
						}).catch(e => {
							console.log('Error: '+e.message);
						});

						res.json(light);
					}
				});
			} else {
				res.send(new Error("error msg")); 
			}
	    });
	});

	router.route('/lights/:light_id')
		.get(function(req, res) {
			Light.findById(req.params.light_id, function(err, light) {
				if(err)
					res.send(err)

				res.json(light)
			});
		})

		.put(function(req, res) {
			Light.findById(req.params.light_id, function(err, light) {
				if(err)
					res.send(err)

				if(req.body.name) {
					light.name = req.body.name.toLowerCase();
				} else {
					light.name = light.name;
				}

				if(req.body.state) {
					if(req.body.state != 'true' && req.body.state != 'false') {
						light.state = 'false';
					} else {
						light.state = req.body.state;
					}
				}

				if(req.body.channel) {
					light.channel = req.body.channel;
				}

				light.save(function(err) {
					if(err) {
						res.send(err)
					} else {
				 relaxful.request('POST',SOCKET_SERVER_URL,{body:'data='+JSON.stringify(light),headers: {'Content-Type':'application/x-www-form-urlencoded'}});
						res.json({message:"Light Updated"});
					}
				});
			});
		})

		.delete(function(req, res) {
			Light.remove({
				_id: req.params.light_id
			}, function(err, light) {
				if(err)
					res.send(err)

				res.json({message:'Light Deleted'});
			});
	});

	app.use('/api', router);

	console.log('API Started');
};
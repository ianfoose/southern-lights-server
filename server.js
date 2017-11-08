var express = require('express');
var relaxful = require('relaxful');
var app = express();
var https = require('https');
var fs = require('fs');
var bodyParser = require('body-parser');

// ssl option
var keyFile = fs.readFileSync('/home/administrator/ssl/fooseindustries.com.key','utf8');
var crtFile = fs.readFileSync('/home/administrator/ssl/fooseindustries.com.crt','utf8');
var caFile = fs.readFileSync('/home/administrator/ssl/gandi_intermediate.crt','utf8');

var options = { key: keyFile, cert: crtFile, ca: caFile };

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/lights'); 

// Socket Server URL
var SOCKET_SERVER_URL = 'https://fooseindustries.com:3500/sendData';

var Light = require('./models/Light');

var port = process.env.PORT || 8080;

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

// for http
// var http = require('http');
// var httpServer = http.createServer(app);
// httpServer.listen(port);

// for https
var httpsServer = https.createServer(options,app);
httpsServer.listen(port);

console.log('API Started');

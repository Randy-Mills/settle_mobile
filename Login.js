var express = require('express');
var crypto = require('crypto');
var mysql = require('mysql');
var Sequelize = require('sequelize');
var app = express();
app.use(express.cookieParser());
app.use(express.bodyParser());

var sequelize = new Sequelize('DATABASE', 'USER', 'PASSWORD', {host: 'HOST', port: 3306});

var cryptoKey = 'KEY_HERE';
var expireTime = 120; //Expire time in minutes

var ApplicationUser = sequelize.import(__dirname + "/models/ApplicationUser.js");
var Company = sequelize.import(__dirname + "/models/Company.js");
var CostingCode = sequelize.import(__dirname + "/models/CostingCode.js");
var Employee = sequelize.import(__dirname + "/models/Employee.js");
var ForecastEntry = sequelize.import(__dirname + "/models/ForecastEntry.js");
var TimeEntry = sequelize.import(__dirname + "/models/TimeEntry.js");
var UserCostingCode = sequelize.import(__dirname + "/models/UserCostingCode.js");

Employee.hasOne(ApplicationUser, {foreignKey: 'employeeId'});

Employee.hasMany(TimeEntry, {foreignKey: 'employeeId'});

sequelize.sync();

/*
 *	If the user is found, and the password is a match, this returns an access token
 *	to be passed with additional requests.
 */
app.post('/accesstoken', function(req, res) {
	if(!req.body.hasOwnProperty('username') ||
		!req.body.hasOwnProperty('password')) {
		res.statusCode = 400;
		return res.send('Error 400: Post syntax incorrect');
	}

	var md5 = crypto.createHash('md5');

	var credentials = {
		username : req.body.username,
		password : md5.update(req.body.password).digest('hex')
	};

	Employee.find({ where: {userName: credentials.username}, include: [ApplicationUser]}).success(function(employee) {
		if(credentials.password == employee.applicationUser.hashedPassword) {
			
			//Generate an access token salted with the current time (of the server)
			var cipher = crypto.createCipher('aes-256-cbc',cryptoKey);
			var currentTime = new Date();
			var ct = currentTime.getTime();
			ct = ct+"|"+credentials.username;
			var crypted = cipher.update(ct,'utf8','hex')
			crypted += cipher.final('hex');
			res.json(crypted);
		} else {
			return res.send('Error 406: The request returned an unexpected result');
		}
	});
});

/*
 *	Expects an access key aquired from login.
 *	Returns all time entries for the current month as a JSON.
 */
app.get('/calendar/:user', function(req, res) {
	if(!req.query.hasOwnProperty('key')) {
		res.statusCode = 400;
		return res.send('Error 400: Get syntax incorrect');
	} 

	var ak = validate(req.query.key);
	if(ak == false) {
		res.statusCode = 401;
		return res.send('Error 401: Access token has expired');
	} else if(ak != req.params.user) {
		res.statusCode = 400;
		return res.send('Error 400: Bad request');
	}

	Employee.findAll({where: {userName: ak}, include: [TimeEntry]}).success(function(timeentries) {
		var entries = new Array();
		var curDate = new Date();

		var te = timeentries[0].timeEntry;

		for(i=0;i<te.length;i++) {
			if(te[i].entryDate.getMonth() == curDate.getMonth()) {
				entries.push(te[i]);
			}
		}

		res.json(JSON.stringify(entries));
	});

	// var dbquery = "SELECT te.approvalStatus, te.entryDate, te.comments, te.costingCodeId, " 
	// 			+ "te.hours FROM TimeEntry te JOIN ApplicationUser au JOIN Employee e "
	// 			+ "WHERE e.userName='" + ak + "' "
	// 			+ "AND au.employeeId=te.employeeId "
	// 			+ "AND e.employeeId=au.employeeId "
	// 			+ "AND MONTH(te.entryDate)=MONTH(CURRENT_DATE)";

	// connection.query('USE ebdb', function(err) {
	// 	if(err) throw err;
	// 	connection.query(dbquery, function(err, results) {
	// 		if(err) throw err;

	// 		res.json(JSON.stringify(results));
	// 	});
	// });
});

/*
 *	Expects an access key aquired from login. Returns all current timecode or, if a
 *	user is specified returns all timecodes currently associated with that user.
 */
app.get('/timecodes/:user', function(req, res) {
	if(!req.query.hasOwnProperty('key')) {
		res.statusCode = 400;
		return res.send('Error 400: Get syntax incorrect');
	} 

	var ak = validate(req.query.key);
	if(ak == false) {
		res.statusCode = 401;
		return res.send('Error 401: Access token has expired');
	} else if(ak != req.params.user && req.params.user != "all") {
		res.statusCode = 400;
		return res.send('Error 400: Bad request');
	}

	if(req.params.user != "all") {
		var dbquery = "SELECT c.shortName, cc.name FROM CostingCode cc JOIN UserCostingCode ucc JOIN Employee e "
					+ "JOIN ApplicationUser au JOIN Company c"
					+ "WHERE e.userName='" + ak + "' "
					+ "AND e.employeeId=au.employeeId "
					+ "AND au.userId=ucc.userId "
					+ "AND ucc.costingCodeId=cc.costingCodeId "
					+ "AND c.companyId=cc.companyId";
	} else {
		var dbquery = "SELECT c.shortName, cc.name FROM CostingCode cc JOIN Company c "
					+ "WHERE c.companyId=cc.companyId";
	}

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(dbquery, function(err, results) {
			if(err) throw err;

			res.json(JSON.stringify(results));
		});
	});
});

/*
 *	Expects an access key aquired from login and a CostingCode name to be
 *	added to the users CostingCode list.
 */
app.post('/timecodes/:user', function(req, res) {
	if(!req.query.hasOwnProperty('key') ||
		!req.body.hasOwnProperty('costcode')) {
		res.statusCode = 400;
		return res.send('Error 400: Get syntax incorrect');
	} 

	var ak = validate(req.query.key);
	if(ak == false) {
		res.statusCode = 401;
		return res.send('Error 401: Access token has expired');
	} else if(ak != req.params.user) {
		res.statusCode = 400;
		return res.send('Error 400: Bad request');
	}

	var dataquery = 'INSERT INTO UserCostingCode (costingCodeId, userId) '
				  + 'SELECT cc.costingCodeId, au.userId FROM CostingCode cc JOIN Employee e JOIN ApplicationUser au '
				  + 'WHERE cc.name="'+req.body.costcode+'" '
				  + 'AND e.userName="'+ak+'" '
				  + 'AND e.employeeId=au.employeeId';

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(dataquery, function(err, results) {
			if(err) throw err;

			res.json(true);
		});
	});
});

/*
 *	Expects an access key aquired from login and a CostingCode name to be
 *	added to the users CostingCode list.
 */
app.delete('/timecodes/:user', function(req, res) {
	if(!req.query.hasOwnProperty('key') ||
		!req.body.hasOwnProperty('costcode')) {
		res.statusCode = 400;
		return res.send('Error 400: Get syntax incorrect');
	} 

	var ak = validate(req.query.key);
	if(ak == false) {
		res.statusCode = 401;
		return res.send('Error 401: Access token has expired');
	} else if(ak != req.params.user) {
		res.statusCode = 400;
		return res.send('Error 400: Bad request');
	}

	var deletequery = 'DELETE FROM UserCostingCode WHERE costingCodeId IN  ('
					+ 'SELECT cc.costingCodeId FROM CostingCode cc '
					+ 'WHERE cc.name="'+req.body.costcode+'"'
					+ ') AND userId IN ('
					+ 'SELECT au.userId FROM Employee e JOIN ApplicationUser au '
					+ 'WHERE e.userName="'+ak+'" '
					+ 'AND e.employeeId=au.employeeId)';

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(deletequery, function(err, results) {
			if(err) throw err;

			res.json(true);
		});
	});
});

/*
 *	Expects an access key aquired from login, hours to assign the entry, 
 *	and [OPTIONAL] comments for the task. Returns true if the entry was
 *	added successfully.
 */
app.put('/entry/:user/:year/:month/:day', function(req, res) {
	var datetime = checkDate(req);

	if(!req.body.hasOwnProperty('key') ||
		!req.body.hasOwnProperty('costcode') ||
		datetime==false) {
		res.statusCode = 400;
		return res.send('Error 400: Put syntax incorrect');
	}

	var ak = validate(req.body.key);
	if(ak == false) {
		res.statusCode = 401;
		return res.send('Error 401: Access token has expired');
	} else if(ak != req.params.user) {
		res.statusCode = 400;
		return res.send('Error 400: Bad request');
	}

	var dataquery = 'SELECT te.timeEntryId FROM TimeEntry te JOIN Employee e JOIN CostingCode cc '
				  + 'WHERE te.costingCodeId=cc.costingCodeId '
				  + 'AND te.entryDate="'+datetime+'" '
				  + 'AND cc.name="'+req.body.costcode+'" '
				  + 'AND e.userName="'+ak+'"';

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(dataquery, function(err, results) {
			if(err) throw err;
			
			if(moderesults.length > 0) update(req, res, moderesults[0].timeEntryId, datetime);
			else timeentry_insert(req, red, results[0], datetime); 
		});
	});
});

/*
 *	Expects an access key aquired from login and the costingCode associated with
 *	the entry to be removed. Returns true if the entry was successfully removed.
 */
app.delete('/entry/:user/:year/:month/:day', function(req, res) {
	var datetime = checkDate(req);

	if(!req.body.hasOwnProperty('key') ||
		!req.body.hasOwnProperty('costcode') ||
		datetime==false) {
		res.statusCode = 400;
		return res.send('Error 400: Delete syntax incorrect');
	}

	var ak = validate(req.body.key);
	if(ak == false) {
		res.statusCode = 401;
		return res.send('Error 401: Access token has expired');
	} else if(ak != req.params.user) {
		res.statusCode = 400;
		return res.send('Error 400: Bad request');
	}

	//Used to aquire the costingCodeId and employeeId used to find the TimeEntry row.
	var dataquery = 'DELETE FROM TimeEntry WHERE costingCodeId IN  ('
					+ 'SELECT cc.costingCodeId FROM CostingCode cc '
					+ 'WHERE cc.name="'+req.body.costcode+'" '
				  + ') AND employeeId IN ('
					+ 'SELECT e.employeeId FROM Employee e '
					+ 'WHERE e.userName="'+ak+'" '
				  + ') AND entryDate="'+datetime+'"';

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(dataquery, function(err, results) {
			if(err) throw err;
			res.json(true);
		});
	});
});

/*
 *	Expects an access key aquired from login, hours to assign the entry, 
 *	the costcode for the entry. Additionally a date can be passed as
 *	well in which case an entry will be generated for each day in between.
 */
app.put('/forecast/:user/:year/:month/:day', function(req, res) {
	var datetime = checkDate(req);
	var enddate = true;

	if(req.body.hasOwnProperty('enddate')) {
		enddate = checkDate(req.body.enddate);
	}

	if(!req.body.hasOwnProperty('key') ||
		!req.body.hasOwnProperty('costcode') ||
		datetime==false || enddate==false) {
		res.statusCode = 400;
		return res.send('Error 400: Put syntax incorrect');
	}

	var ak = validate(req.body.key);
	if(ak == false) {
		res.statusCode = 401;
		return res.send('Error 401: Access token has expired');
	} else if(ak != req.params.user) {
		res.statusCode = 400;
		return res.send('Error 400: Bad request');
	}

	var dataquery = 'SELECT e.employeeId, cc.costingCodeId FROM Employee e JOIN CostingCode cc '
				  + 'WHERE cc.name="'+req.body.costcode+'" '
				  + 'AND e.userName="'+ak+'"';

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(dataquery, function(err, results) {
			if(err) throw err;

			forecastentry_insert(req, res, results[0], datetime, enddate);
		});
	});
});

/*
 *
 */
app.get('/forecast/:user', function(req, res) {
	forecast_fetch(req, res);
});

/*
 *
 */
app.get('/forecast/:user/:year', function(req, res) {
	forecast_fetch(req, res);
});

/*
 *
 */
app.get('/forecast/:user/:year/:month', function(req, res) {
	forecast_fetch(req, res);
});

/*
 *
 */
app.get('/forecast/:user/:year/:month/:day', function(req, res) {
	forecast_fetch(req, res);
});

/*
 *	Expects an access key aquired from login and a new unhashed password to
 *	overwrite the users previous password.
 */
app.post('/password/:user', function(req, res) {
	var datetime = checkDate(req);

	if(!req.body.hasOwnProperty('key') ||
		req.body.hasOwnProperty('password') ||
		datetime==false) {
		res.statusCode = 400;
		return res.send('Error 400: Delete syntax incorrect');
	}

	var ak = validate(req.body.key);
	if(ak == false) {
		res.statusCode = 401;
		return res.send('Error 401: Access token has expired');
	} else if(ak != req.params.user) {
		res.statusCode = 400;
		return res.send('Error 400: Bad request');
	}

	var md5 = crypto.createHash('md5');

	var newPassword = md5.update(req.body.password).digest('hex');

	//Used to aquire the costingCodeId and employeeId used to find the TimeEntry row.
	var dataquery = 'UPDATE ApplicationUser au JOIN Employee e '
				  + 'SET au.hashedPassword="'+newPassword+'"" '
				  + 'WHERE e.userName="'+ak+'" '
				  + 'AND au.employeeId=e.employeeId';

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(dataquery, function(err, results) {
			if(err) throw err;
			res.json(true);
		});
	});
});

/*
 *	Called to run the sql query to insert the new TimeEntry.
 */
function timeentry_insert(req, res, results, datetime) {
	var insertquery = 'INSERT INTO TimeEntry (employeeId, costingCodeId, hours, approvalStatus, entryDate, comments) '
					+ 'VALUES (' + results.employeeId + ',' + results.costingCodeId + ',' 
					+ req.body.hours + ', 1, "' + datetime + '","' + req.body.comments + '")';

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(insertquery, function(err, results) {
			if(err) throw err;
			res.json('insert');
		});
	});
}

/*
 *
 */
function forecast_fetch(req, res) {
	if(!req.query.hasOwnProperty('key')) {
		res.statusCode = 400;
		return res.send('Error 400: Delete syntax incorrect');
	}

	var ak = validate(req.query.key);
	if(ak == false) {
		res.statusCode = 401;
		return res.send('Error 401: Access token has expired');
	} else if(ak != req.params.user) {
		res.statusCode = 400;
		return res.send('Error 400: Bad request');
	}

	var year = -1;
	var month = -1;
	var day = -1;
	if(req.params.hasOwnProperty('year')) year=parseInt(req.params.year);
	if(req.params.hasOwnProperty('month')) month=parseInt(req.params.month);
	if(req.params.hasOwnProperty('day')) day=parseInt(req.params.day);

	var dbquery = 'SELECT cc.name, fe.hours, fe.entryDate FROM ForecastEntry fe JOIN Employee e JOIN CostingCode cc '
				+ 'WHERE fe.employeeId=e.employeeId '
				+ 'AND e.userName="'+ak+'" '
				+ 'AND fe.costingCodeId=cc.costingCodeId ';

	if(year >= 0) dbquery = dbquery + 'AND YEAR(fe.entryDate)='+year+' ';
	if(month >= 0) dbquery = dbquery + 'AND MONTH(fe.entryDate)='+month+' ';
	if(day >= 0) dbquery = dbquery + 'AND DAY(fe.entryDate)='+day+' ';

	console.log(month);

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(dbquery, function(err, results) {
			if(err) throw err;

			res.json(JSON.stringify(results));
		});
	});
}

/*
 *	Called to run the sql query to insert a number of forecasts.
 */
function forecastentry_insert(req, res, results, start_datetime, end_datetime) {
	var sDate = new Date(start_datetime);
	var eDate = new Date(end_datetime);

	var insertquery = 'INSERT INTO ForecastEntry (employeeId, costingCodeId, hours, approvalStatus, entryDate) ';
					+ 'VALUES (' + results.employeeId + ',' + results.costingCodeId + ',' 
					+ req.body.hours + ', 1, "' + datetime + '")';

	while(sDate <= eDate) {
		var datetime = sDate.toISOString();
		insertquery = insertquery + 'VALUES ('+results.employeeId+','+results.costingCodeId+','+req.body.hours+', 1, "'+datetime.slice(0,datetime.indexOf("T"))+' 00:00:00") ';
		sDate.setDate(sDate.getDate + 1);
	}

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(insertquery, function(err, results) {
			if(err) throw err;
			res.json('insert');
		});
	});
}

/*
 *	Checks to ensure that the date provided in the request is an actual date.
 *	Returns an SQL format Datetime string if valid, false otherwise.
 */
function checkDate(req) {
	var year = parseInt(req.params.year);
	var month = parseInt(req.params.month);
	var day = parseInt(req.params.day);

	var date = new Date(year, month-1, day);
	var convertedDate = ""+date.getFullYear() + (date.getMonth()+1) + date.getDate();
	var givenDate = "" + year + month + day;

	if(givenDate == convertedDate) return year+"-"+month+"-"+day+" 00:00:00";

	return false;
}

/*
 *	Called to run the sql query to update an existing TimeEntry.
 */
function update(req, res, results, datetime) {
	var updatequery = 'UPDATE TimeEntry '
					+ 'SET hours='+req.body.hours+', comments="'+req.body.comments+'" '
					+ 'WHERE timeEntryId='+results;

	connection.query('USE ebdb', function(err) {
		if(err) throw err;
		connection.query(updatequery, function(err, results) {
			if(err) throw err;
			res.json('update');
		});
	});
}

/*
 *	If the key is currently valid, this function returns the username associated with
 *	the provided key. Otherwise returns false.
 */
function validate(key) {
	var decipher = crypto.createDecipher('aes-256-cbc',cryptoKey);
	var decrypt = decipher.update(key,'hex','utf8');
	decrypt += decipher.final('utf8');
	
	var currentTime = new Date();
	var t = parseInt(decrypt.slice(0,decrypt.indexOf("|")));
	var user = decrypt.slice(decrypt.indexOf("|")+1, decrypt.length);

	//Access tokens are only good for a set amount of time, this determines if they are still good.
	if(currentTime.getTime() > t+(expireTime*60000)) {
		return false;
	}

	return user;
}

/*
 *	Local testing hosts on port 5000
 */
var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});
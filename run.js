var express = require('express');
var app = express();
var fs = require('fs');

app.use(express.static(__dirname));

/*app.get('/', function (req, res) {
	fs.readFile(__dirname + '/test/index.html', function (err, result) {
		if (err) {
			throw err;
		}

		res.send(result.toString());
	});
});*/

app.listen(5001);
var request = require("request");
var cheerio = require("cheerio");

request("http://www.archives.gov/federal-register/electoral-college/votes/votes_by_state.html", function(err, resp, body) {
	var $ = cheerio.load(body);
	var years = {};
	var results = [];

	$('a').each(function(i, v) {
		if (/^\d{4}$/.test($(v).text())) {
			years[$(v).text()] = $(v).attr("href");
		}
	});

	// while (Object.keys(years).length) {
		var page = years[Object.keys(years)[0]];

		request("http://www.archives.gov" + page, function(err, resp, body) {
			var $ = cheerio.load(body);

			$("strong").each(function(i, title) {
				var year = $(title).text().split(" ")[0];
				var term = $(title).find("a").text();
				var table = $(title).parent().next();
				var states = {};

				// 
				$(table).find("tr:nth-child(1) th").each(function(i, state) {
					var name = $(state).text().trim();
					if (name.length == 2) {
						states[i] = name;
					}
				});



			});
		});


	// }

});
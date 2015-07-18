#!/usr/bin/env node

var fs = require("fs"),
	xlsToJSON = require("excel-to-clean-json"),
	csv = require("fast-csv");

var standards = require("./fields.json");

var args = require('minimist')(process.argv.slice(2));

// read the XLS file from the FEC and convert to JSON
function parse(year) {
	var filename = standards[year].filename,
		parties = {};

	var parties = partyLabels("fec/" + filename, standards[year].parties);
	var results = electionResults(year, standards[year], parties);

	console.log("Found data for " + Object.keys(results).length + " races in " + year);

	fs.writeFileSync("data/parties_" + year + ".json", JSON.stringify(parties, null, 2));
	fs.writeFileSync("data/results_" + year + ".json", JSON.stringify(results, null, 2));

	var csvStream = csv
	    .createWriteStream({headers: true});

	var writableStream = fs.createWriteStream("data/results_" + year + ".csv");

	csvStream.pipe(writableStream);

	for (var race in results) {
		for (var candidate in results[race]) {
			csvStream.write(results[race][candidate]);
		}
	}
	csvStream.end();	
}

// get the party labels from the FEC doc
function partyLabels(filename, worksheet_name) {
	var parties = {};
	xlsToJSON.rows(filename, worksheet_name).forEach(function(party) {
		if (party.length >= 3) {
			parties[party[0]] = party[2];
		}
	});
	return parties;
}


function electionResults(year, opts, parties) {
	var candidates = xlsToJSON.json("fec/" + opts.filename, opts.results),
		races = {};

	candidates.forEach(function(candidate, c) {
		if (!candidate[opts.fullname]) {
			return;
		}

		var datum = {
			id: year + "_" + candidate["STATE ABBREVIATION"],
			year: year,
			name: candidate[opts.fullname].replace("#",""),
			abbr: candidate["STATE ABBREVIATION"],
			state: candidate[opts.state],
			votes: candidate[opts.general],
			parties: []
		};

		// remove rows with no entry for name or general election votes
		if (!datum.name || !datum.votes) {
			//console.log(datum);
			return;
		}

		// some partial votes for multi-party states express with brackets and commas
		if (typeof datum.votes === "string") {
			datum.votes = parseInt(datum.votes.replace(/[\[\],]+/g, ""), 10);
		}

		if (!args.territories) {
			if (["AS","PR","DC","GU","MP","PR","VI"].indexOf(datum.state) !== -1) {
				return;
			}
		}

		// remove those with a votes entry who didn't get any votes or who aren't individuals
		if (/Scattered|None of These/i.test(datum.name) || (typeof datum.votes !== "number" && datum.votes !== "Unopposed")) {
			return;
		}

		// a "combined" party will double-count results
		if (/combined/i.test(candidate.PARTY)) {
			return;
		}

		// we need to use a candidate's id as a unique id since some states (Screw you, New York!) list candidates multiple times
		races[datum.id] = races[datum.id] || {};

		// if we already have this candidate, add votes
		if (races[datum.id][datum.name]) {
			races[datum.id][datum.name].votes += datum.votes;			
		} else {
			races[datum.id][datum.name] = datum;
		}

		if (!candidate.PARTY || candidate.PARTY == "") {
			// take away votes when no party present, because typically represents combined totals
			//console.log("No party for", datum.id, datum.name, "so subtracting votes from line", c+2);
			races[datum.id][datum.name].votes -= datum.votes;
			return;			
		}

		// some write-ins expressed as "W(DEM)" or "IND/G" etc
		candidate.PARTY.split(/\W+/).forEach(function(d) { 
			d = d.trim();
			if (d !== "") {
				if (parties[d]) {
					races[datum.id][datum.name].parties.push(parties[d]);
				} else {
					//console.log("Missing party for", d, datum);
				}
			}
		});
	});
	return races;
}

function combineJSON() {
	var elections = [];

	for(var y = 2004; y <= 2012; y += 2) {
		var data = require("./data/results_" + y + ".json");
		for (var election_id in data) {
			var race = {
				candidates: []
			};
			for (var candidate_id in data[election_id]) {
				var candidate = data[election_id][candidate_id];
				race.id = candidate.id;
				race.year = y;
				race.state = candidate.state;
				race.district = candidate.district;
				race.candidates.push({
					name: candidate.name,
					parties: candidate.parties,
					votes: candidate.votes
				})
			}
			elections.push(race);
		}
	}
	fs.writeFileSync("data/elections.json", JSON.stringify(elections));
}

if (args.year) {
	if (args.year === "all") {
		parse(2004); parse(2008); parse(2012);
	} else {
		parse(args.year);
	}
} else if (args._[0] == "combine") {
	parse(2004); parse(2008); parse(2012);
	combineJSON();
}
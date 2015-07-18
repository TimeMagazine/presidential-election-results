# presidential-election-results
Presidential equivalent to our `congressional-election-results` repo

=======

The FEC maintains a [record of official election results](http://www.fec.gov/pubrec/electionresults.shtml) for presidential and congressional elections. Unsurprisingly, the format changes frequently. The repo attempts to tame that insanity and produce clear results in a clean format. Our pain should not be your pain.

## Word to the wise
If using this data, please spot check any figures against the original FEC documents. While we're pretty confident about the methodology here, different states record results in different ways so it's always good to double check.

## Fine, fine -- Give me the data

There's a JSON file organized by race and then candidate for the Presidential elections in 2004, 2008 and 2012 in the [data](/data) directory. A given election looks like this:

	{
	  "2012_AL": {
	    "Romney, Mitt": {
	      "id": "2012_AL",
	      "year": 2012,
	      "name": "Romney, Mitt",
	      "abbr": "AL",
	      "state": "Alabama",
	      "votes": 1255925,
	      "parties": [
	        "Republican"
	      ]
	    },
	    "Obama, Barack": {
	      "id": "2012_AL",
	      "year": 2012,
	      "name": "Obama, Barack",
	      "abbr": "AL",
	      "state": "Alabama",
	      "votes": 795696,
	      "parties": [
	        "Democratic"
	      ]
	    }, // etc

The same information is also output in CSV files. There is also a single file with all five cycles at [data/elections.json](data/elections.json).

## A brief tour behind the scenes
The unmodified Excel files from the FEC live in the [fec](/fec) directory. You're welcome to replace them any time if you have reason to suspect there have been any modifications. 

Since the format changes each cycle, [fields.json](fields.json) stores the various field names we'll need. There's also a file called [missing_parties.json](missing_parties.json) with a few party names that the FEC forgot to include. 

If you want to rerun the script to produce the JSON from the FEC's files, go right ahead:

	npm install
	node index.js --year=2010

You can pass "all" to the `year` flag to get every year, or just run this to get the combined file:

	node index.js combine

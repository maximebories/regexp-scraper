# regex-scraper
Advanced use of Puppeteer to scrape Google web engine results against a RegExp. You have to provide a search query and a regular expression to match against either the Google search results page or the full page content depending on how thorough you want the search to be.

##

To get a lock on node modules:

	$ npm update

To run:

	$ node index.js
 
The example I used here was to find fraud phishing URLs send through text messages for further investigations, DO NOT click on any of them unless you know what you are doing.



## How to use the script

To run the script, use the following command:

node script.js 'search query' 'regular expression' filter

Replace 'search query' with the query you want to use for the search, 'regular expression' with the regular expression you want to use to match against the page content, and 'filter' with 'true' if you want to filter the search results or 'false' if you don't want to filter the results.

For example, to perform a search for the query 'Votre colis a été envoyé. Veuillez le vérifier et le recevoir.' which is a common text phishing in France, disabling filtering Google similar results search, the results and using the regular expression 'http://[a-z]{5}.[a-z]{5}.[a-z]+' that capture all the URLs that are being used in this fishing operation, use the following command:

node script.js 'Votre colis a été envoyé. Veuillez le vérifier et le recevoir.' 'http://[a-z]{5}.[a-z]{5}.[a-z]+' false

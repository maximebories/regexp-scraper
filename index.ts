const puppeteer = require('puppeteer');
const fs = require('fs');

// Set query and regex crawling parameters
var data = [];
const query = '"Votre+colis+a+été+envoyé.+Veuillez+le+vérifier+et+le+recevoir."+"http"+".com"';
const regexp = /http:\/\/[a-z]{5}\.[a-z]{5}\.[a-z]+/gm;

(async () => {
	// Init browser
	const browser = await puppeteer.launch({ headless: false, timeout: 30000 });
	const page = await browser.newPage();

	// Load cookies from previous session
	const cookiesString = fs.readFileSync('cookies.json');
	let cookies = JSON.parse(cookiesString);
	if (cookies.length !== 0) {
		for (let cookie of cookies) {
			await page.setCookie(cookie);
		}
	}

	// Init browsing session & specify we do want to exclude results
	await page.goto('https://www.google.fr/search?q=' + query + '&filter=0');
	const navigationPromise = page.waitForNavigation();

	// Loop through pagination & get RegExp matches
	let loop = true;
	while (loop) {
		const pageContent = await page.content();
		const urls = pageContent.match(regexp);
		data.push(urls);
		if (await page.$('#pnnext') !== null) {
			await page.click('#pnnext');
			await navigationPromise;
			await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000);
			loop = true;
		} else {
			loop = false;
		}
	};

	// Save cookies for later use
	cookies = await page.cookies();
	fs.writeFileSync('cookies.json', JSON.stringify(cookies));
	await browser.close();

	// Save scraped data
	fs.writeFile("data.json", JSON.stringify(data), err => {
		if (err) throw err;
		console.log('Crawling complete.');
	}
	);
})();

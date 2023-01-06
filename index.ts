const puppeteer = require('puppeteer');
const fs = require('fs');

// Get search query, regular expression, and "filter" boolean from command line arguments
const query = process.argv[2].replace(/ /g, '+');
const regexp = new RegExp(process.argv[3], 'gm');
const filter = process.argv[4] === 'true';

var data = [];

(async () => {
	const browser = await puppeteer.launch({ headless: false, timeout: 5000 });
	const page = await browser.newPage();

	const cookiesString = fs.readFileSync('cookies.json');
	let cookies = JSON.parse(cookiesString);
	if (cookies.length !== 0) {
		for (let cookie of cookies) {
			await page.setCookie(cookie);
		}
	}

	// Construct Google search URL with search query and "filter" parameter
	let searchUrl = `https://www.google.fr/search?q=intext%3A%28${query}%29`;
	if (filter) {
		searchUrl += '&filter=0';
	}
	await page.goto(searchUrl);
	const navigationPromise = page.waitForNavigation();

	let loop = true;
	let iterationCount = 0;
	while (loop) {
		// Stop the loop after 20 iterations
		if (iterationCount >= 20) {
			loop = false;
			break;
		}

		const results = await page.evaluate(() => {
			const anchors = Array.from(document.querySelectorAll('div[data-header-feature] > div > a'));
			return anchors.map(anchor => anchor.href);
		});
		// Open new tab for each link
		for (let i = 0; i < results.length; i++) {
			if (subSearch) {
				// Open a new tab for each search result and perform sub-search
				const newPage = await browser.newPage();
				await newPage.goto(results[i]);
				// Check if a ReCAPTCHA is present
				if (await newPage.$('#recaptcha') !== null) {
					console.log('ReCAPTCHA detected. Pausing loop.');
					loop = false;
					break;
				}
				// Perform sub-search using the regular expression
				const subSearchResults = await newPage.evaluate((regexp) => {
					const pageContent = document.body.innerText;
					const matches = pageContent.match(regexp);
					if (matches) {
						return matches;
					}
					return [];
				}, regexp);
				if (subSearchResults.length > 0) {
					data.push(subSearchResults);
					console.log(subSearchResults);
				}
				await newPage.close();
			} else {
				// Open a new tab for each search result and get page content
				const newPage = await browser.newPage();
				await newPage.goto(results[i]);
				// Check if a ReCAPTCHA is present
				if (await newPage.$('#recaptcha') !== null) {
					console.log('ReCAPTCHA detected. Pausing loop.');
					loop = false;
					break;
				}
				// Get page content
				const pageContent = await newPage.content();
				// Get RegExp matches
				const matches = pageContent.match(regexp);
				if (matches) {
					data.push(matches);
					console.log(matches);
				}
				await newPage.close();
			}
		}
		// Go to next page
		if (await page.$('#pnnext') !== null) {
			console.log('Next page');
			await page.click('#pnnext');
			await navigationPromise;
			await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000);
			iterationCount++;
			loop = true;
		} else {
			loop = false;
		}
	}

	cookies = await page.cookies();
	fs.writeFileSync('cookies.json', JSON.stringify(cookies));
	await browser.close();

	fs.writeFile("data.json", JSON.stringify(data), err => {
		if (err) throw err;
		console.log('Crawling complete.');
	});
})();

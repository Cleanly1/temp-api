const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const app = express();
const cors = require("cors");

const PORT = process.env.PORT || 1337;

require("dotenv").config();

// Logging utility
//const logger = require("./utils/logger");

// Mongoose config
// const { mongo } = require(path.join(__dirname, "config"));

// Cors config - allow all
app.use(cors());
app.options("*", cors());

const viewsPath = path.join(__dirname, "./views");
app.set("view engine", "hbs");
app.set("views", viewsPath);
app.use(express.static(path.join(__dirname, "./public")));
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
//const router = require(path.join(__dirname, "routes"));
//app.use("/", router);

app.get("/", (req, res) => {
	res.render("index");
});
app.get(" ", (req, res) => {
	res.render("index");
});

app.get("/temp", async (req, res) => {
	if (process.env.API_KEY !== req.query.apiKey) {
		res.status(401).send(
			JSON.stringify({
				error: "You don´t have permisson to make a request",
			})
		);
	} else {
		// Tries to scrap a website for information otherwise throws an error
		try {
			(async function () {
				try {
					const browser = await puppeteer.launch();
					const page = await browser.newPage();

					await page.setViewport({
						width: 520,
						height: 480,
						deviceScaleFactor: 1,
					});

					await page.goto("https://gotlandsenergi.se/badkarta/");
					let temps = await page.$$eval(
						".buoys-measurment-list td",
						function (temps) {
							let i = 0;
							let tempArray = [];
							return temps.map(function (temp) {
								i++;
								tempArray.push(temp.textContent);
								if (i == 3) {
									i = 0;
									const returnObject = {
										location: tempArray[0],
										data: {
											airTemp: tempArray[1],
											waterTemp: tempArray[2],
										},
									};
									tempArray = [];
									return returnObject;
								}
							});
						}
					);
					await browser.close();
					temps = await temps.filter((temp) => temp);
					//console.log(temps.join(`\n`));

					res.status(200).send(JSON.stringify(temps));
				} catch (e) {
					console.log(e);
				}
			})();
		} catch (error) {
			res.status(404).send(`Couldn´t find any temperatures this time`);
		}
	}
});

// Handle unsupported routes
// app.use((req, res, next) => {
// 	const error = new Error("This is not the route you are looking for");
// 	error.status = 404;
// 	next(error);
// });
// Handle errors thrown in routes
// app.use((error, req, res, next) => {
//   logger.error(error);

//   res.status(error.status || 500);
//   res.json({
//       error: {
//           message: error.message
//       }
//   });
// });

app.listen(PORT, () => console.log(`Server is running on ${PORT}`));

"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const dotnev = require("dotenv");
dotnev.config();
const app = express();
let cors = require("cors");

app.use(cors());

app.use(
	cors({
		origin: process.env.origin,
		credentials: true
	})
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/api/refresh-cron", (req, res) => {
	try {
		res.status(200).json({
			msg: "DONE"
		});
		process.exit();
		return;
	} catch (error) {
		console.log(error);
	}
});
require("./startAllEmailCampaigns");
require("./startAllSlackCampaigns");

if (process.env.NODE_ENV === "production") {
	app.use((req, res, next) => {
		if (req.header("x-forwarded-proto") !== "https") res.redirect(`https://${req.header("host")}${req.url}`);
		else next();
	});
}

let port = process.env.PORT || process.env.PORT_NUM;
app
	.listen(port, function() {
		console.log(`Listening at port ${port}`);
	})
	.on("error", function(error) {
		console.log(error);
	});

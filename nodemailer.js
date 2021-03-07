"use strict";
const { text } = require("body-parser");
const nodemailer = require("nodemailer");
const dotnev = require("dotenv");
dotnev.config();
module.exports = {
	sendMail: async (from, to, subject, text, html) => {
		nodemailer.createTestAccount(async (err, account) => {
			let transporter = nodemailer.createTransport({
				host: "smtp.mailtrap.io",
				port: 2525,
				auth: {
					user: process.env.MAIL_TRAP_USER,
					pass: process.env.MAIL_TRAP_USER_PASS_WORD
				}
			});
			let mailOptions = {
				from: from,
				to: to,
				subject: subject,
				text: text,
				html: html
			};

			await transporter.sendMail(mailOptions);
		});
	}
};

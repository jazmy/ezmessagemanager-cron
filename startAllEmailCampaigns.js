const schedule = require("node-schedule");
const services = require("./services");
const moment = require("moment");
const momenttz = require("moment-timezone");
const { query } = require("express");
const fetch = require("isomorphic-fetch");
let handlebars = require("handlebars");
const dotnev = require("dotenv");
const { templates } = require("handlebars");
const delay = require("delay");
let axios = require("axios");
dotnev.config();
let SERVER_URL = process.env.STRAPI_APP_SERVER_URL;
startAllEmailCampaigns = async () => {
	try {
		const campaigns = await services.getAllEmailSchedules();
		if (campaigns.length > 0) {
			for (let i = 0; i < campaigns.length; i++) {
				// console.log(campaigns[0]);
				let timezone = JSON.parse(decodeURIComponent(campaigns[i].timezone)).value;
				let date_time = `${campaigns[i].date} ${campaigns[i].time}`;
				let date_time_time_zone = momenttz.tz(date_time, timezone).format();
				const runSchedule = moment(date_time_time_zone).format("0 m H * * *");

				//working code

				schedule.scheduleJob(campaigns[i].id.toString(), runSchedule, (fireDate) => {
					console.log(fireDate);
					let id = campaigns[i].id;
					let currentCampaign = campaigns.filter((cm) => {
						return cm.id === id;
					});
					let emailtemplate_id = currentCampaign[0].emailtemplate_id;
					let contactlist_id = currentCampaign[0].contactlist_id;
					let subject = "";
					let text = "";
					let template = "";
					services
						.getEmailTemplateById(emailtemplate_id)
						.then((responseEmailTemplate) => {
							subject = responseEmailTemplate.subject;
							text = responseEmailTemplate.shortmessage;
							let htmlgen = unescape(responseEmailTemplate.longmessage);
							template = handlebars.compile(htmlgen);
						})
						.then(() => {
							services.getContactById(contactlist_id).then((responseQuery) => {
								let encode_query = responseQuery.query;

								let decodedQuery = decodeURIComponent(encode_query);
								if (decodedQuery.includes("today")) {
									var regexp = /<(.*?)>/g;
									var regresults = decodedQuery.match(regexp);

									// By default the total number of days we will add is zero
									var totdays = 0;

									// If we find a match then we replace the zero value with the match value.
									if (regresults) {
										totdays = regresults[0];
									}

									// Now we need to do some clean up and remove the brackets so we only have the number
									var totdays01 = totdays.toString().replace("<", "");
									var totdays02 = totdays01.toString().replace(">", "");

									//For debugging we are displaying the total days in the console
									// console.log("totdays02: " + Number(totdays02));

									// Now we need to remove the brackets and the number from the graphql query because it will break our query.
									var querytosend01 = decodedQuery.replace(totdays, "");
									// get the current date
									var currentdate = new Date();
									// Add the number of days to the current date
									currentdate.setDate(currentdate.getDate() + Number(totdays02));
									var dateFormated = currentdate.toISOString().substr(0, 10);
									// Format the date so it matches what is expected inthe graphql query
									var querytosend02 = querytosend01.replace("today", dateFormated);

									let query = querytosend02;

									fetch(`${SERVER_URL}graphql`, {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({
											query: `${query}`
										})
									})
										.then((res) => res.json())
										.then(async (res) => {
											if (res.data.employees.length > 0) {
												for (let index = 0; index < res.data.employees.length; index++) {
													const element = res.data.employees[index];
													await delay(5000);
													let user = services
														.getEmployeeByEmail(element.email)
														.then((emp) => {
															let metaData = emp.employee_meta_data;
															let requiredMetaData = metaData.map((md) => ({
																field_name: md.field_name,
																content: md.content
															}));
															let customTagsArr = {};
															for (
																let metaindex = 0;
																metaindex < requiredMetaData.length;
																metaindex++
															) {
																let field_name = requiredMetaData[index].field_name;
																let content = requiredMetaData[index].content;
																customTagsArr[field_name] = content;
															}
															let user = [
																{
																	firstname: emp.firstname,
																	lastname: emp.lastname,
																	hiredate: emp.hiredate,
																	created_at: emp.created_at,
																	updated_at: emp.updated_at,
																	...customTagsArr
																}
															];
															let replacements = user[0];
															let html = template(replacements);

															services
																.sendEmails(
																	process.env.EmailFrom,
																	element.email,
																	subject,
																	text,
																	html
																)
																.then(async () => {
																	await axios.post(`${SERVER_URL}Email-Logs`, {
																		email: element.email,
																		subject: subject,
																		message: html,
																		text: text,
																		status: "Sent",
																		datesent: new Date()
																	});
																})
																.catch(async (err) => {
																	console.log(err);
																	await axios.post(`${SERVER_URL}Email-Logs`, {
																		email: element.email,
																		subject: subject,
																		message: html,
																		status: "User Data was not found!"
																	});
																});
														});
													if (index == res.data.employees.length - 1) {
														services.updateEmailSchedulesById(id);
														console.log(
															`Emails Sent to ${res.data.employees
																.length} Employees/Contacts`
														);
													}
												}
											}
										});
								} else {
									let query = decodeURIComponent(encode_query);
									fetch(`${SERVER_URL}graphql`, {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({
											query: `${query}`
										})
									})
										.then((res) => res.json())
										.then(async (res) => {
											if (res.data.employees.length > 0) {
												for (let index = 0; index < res.data.employees.length; index++) {
													const element = res.data.employees[index];
													await delay(5000);
													let user = services
														.getEmployeeByEmail(element.email)
														.then((emp) => {
															let metaData = emp.employee_meta_data;
															let requiredMetaData = metaData.map((md) => ({
																field_name: md.field_name,
																content: md.content
															}));
															let customTagsArr = {};
															for (
																let metaindex = 0;
																metaindex < requiredMetaData.length;
																metaindex++
															) {
																let field_name = requiredMetaData[metaindex].field_name;
																let content = requiredMetaData[metaindex].content;
																customTagsArr[field_name] = content;
															}

															let user = [
																{
																	firstname: emp.firstname,
																	lastname: emp.lastname,
																	hiredate: emp.hiredate,
																	created_at: emp.created_at,
																	updated_at: emp.updated_at,
																	...customTagsArr
																}
															];
															let replacements = user[0];
															let html = template(replacements);

															services
																.sendEmails(
																	process.env.EmailFrom,
																	element.email,
																	subject,
																	text,
																	html
																)
																.then(async () => {
																	await axios.post(`${SERVER_URL}Email-Logs`, {
																		email: element.email,
																		subject: subject,
																		message: html,
																		text: text,
																		status: "Sent",
																		datesent: new Date()
																	});
																})
																.catch(async (err) => {
																	console.log(err);
																	await axios.post(`${SERVER_URL}Email-Logs`, {
																		email: element.email,
																		subject: subject,
																		message: html,
																		status: "User Data was not found!"
																	});
																});
														});
													if (index == res.data.employees.length - 1) {
														services.updateEmailSchedulesById(id);
														console.log(
															`Emails Sent to ${res.data.employees
																.length} Employees/Contacts`
														);
													}
												}
											}
										});
								}
							});
						});
				});
			}
		//refreshing cron by pm2
		//process.exit();
		//return;

		} else {
			console.log(`No Email Campaigns Found...`);
		}
	} catch (error) {
		console.log(error);
	}
};

startAllEmailCampaigns().then(() => {
	let response = schedule.scheduledJobs;
	console.log("Email Schedules...");
	console.log(Object.keys(response));
});

// getAllScheduledCampaigns = async () => {
// 	return await schedule.scheduledJobs;
// };

// getAllScheduledCampaigns().then((x) => {
// 	console.log(x);
// });

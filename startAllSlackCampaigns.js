const { WebClient, LogLevel } = require("@slack/web-api");
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
const generateUsername = require("generate-username-from-email");
dotnev.config();
let SERVER_URL = process.env.STRAPI_APP_SERVER_URL;
let SlackToken = process.env.Slack_Token;

// WebClient insantiates a client that can call API methods
// When using Bolt, you can use either `app.client` or the `client` passed to listeners.
const client = new WebClient(SlackToken, {
	// LogLevel can be imported and used to make debugging simpler
	logLevel: LogLevel.DEBUG
});
startAllSlackCampaigns = async () => {
	try {
		const campaigns = await services.getAllSlackSchedules();
		if (campaigns.length > 0) {
			for (let i = 0; i < campaigns.length; i++) {
				let timezone = JSON.parse(decodeURIComponent(campaigns[i].timezone)).value;
				let date_time = `${campaigns[i].date} ${campaigns[i].time}`;
				let date_time_time_zone = momenttz.tz(date_time, timezone).format();
				const runSchedule = moment(date_time_time_zone).format("0 m H * * *");
				//working code
				schedule.scheduleJob(campaigns[i].id.toString(), runSchedule, async (fireDate) => {
					console.log(fireDate);
					let id = campaigns[i].id;
					let currentCampaign = campaigns.filter((cm) => {
						return cm.id === id;
					});
					let emailtemplate_id = currentCampaign[0].emailtemplate_id;
					let contactlist_id = currentCampaign[0].contactlist_id;
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
									let responseEmailTemplate = await services.getEmailTemplateById(emailtemplate_id);
									let text = responseEmailTemplate.shortmessage;
									if (res.data.employees.length > 0) {
										const result = await client.users.list();
										let filtered_members = [];
										let members_data = [];
										let totalContacts = res.data.employees.length;
										let sentMessages = 0;
										if (result.ok === true) {
											filtered_members = result.members.filter(
												(rs) => rs.is_bot === false && rs.id != "USLACKBOT"
											);
											members_data = filtered_members.map((mm) => ({
												name: mm.name
											}));
										}
										for (let index = 0; index < res.data.employees.length; index++) {
											const element = res.data.employees[index];
											let email = element.email;
											let username = generateUsername(email);
											let i = members_data.findIndex((x) => x.name === username);

											if (i != -1) {
												let member_obj = filtered_members[i];
												console.log(member_obj.real_name);
												let member_channel_id = member_obj.id;
												const result = await client.chat.postMessage({
													channel: member_channel_id,
													text: text
												});
												sentMessages++;
											}

											if (index === res.data.employees.length - 1) {
												await services.updateSlackSchedulesById(id);
												console.log(
													`Total Contacts Found:- ${totalContacts} :) And  Messages delivered to ${sentMessages} member(s), as that were registered to slack...`
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
									let responseEmailTemplate = await services.getEmailTemplateById(emailtemplate_id);
									let text = responseEmailTemplate.shortmessage;
									let totalContacts = res.data.employees.length;
									let sentMessages = 0;
									if (res.data.employees.length > 0) {
										const result = await client.users.list();
										let filtered_members = [];
										let members_data = [];
										if (result.ok === true) {
											filtered_members = result.members.filter(
												(rs) => rs.is_bot === false && rs.id != "USLACKBOT"
											);
											members_data = filtered_members.map((mm) => ({
												name: mm.name
											}));
										}
										for (let index = 0; index < res.data.employees.length; index++) {
											const element = res.data.employees[index];
											let email = element.email;
											let username = generateUsername(email);
											let i = members_data.findIndex((x) => x.name === username);
											if (i != -1) {
												let member_obj = filtered_members[i];
												console.log(member_obj.real_name);
												let member_channel_id = member_obj.id;
												const result = await client.chat.postMessage({
													channel: member_channel_id,
													text: text
												});
												sentMessages++;
											}

											if (index === res.data.employees.length - 1) {
												await services.updateSlackSchedulesById(id);
												console.log(
													`Total Contacts Found:- ${totalContacts} :) And  Messages delivered to ${sentMessages} member(s), as that were registered to slack...`
												);
											}
										}
									}
								});
						}
					});
				});
			}
		} else {
			console.log(`No Campaigns For Slack Found...`);
		}
	} catch (error) {
		console.log(error);
	}
};

startAllSlackCampaigns().then(() => {
	let response = schedule.scheduledJobs;
	console.log("Email + Slack Schedules...");
	console.log(Object.keys(response));
});

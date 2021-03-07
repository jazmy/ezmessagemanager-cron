//We are initilizing a variable "SERVER_URL" component here, that is getting value
//variable by using "process.env"
let SERVER_URL = process.env.STRAPI_APP_SERVER_URL;
//We are importing axios library here, this is use to send/get requests to server
let axios = require("axios");
let node_mailer = require("./nodemailer");
const fetch = require("isomorphic-fetch");

//***this method will send a get request to get all getAllEmailSchedules***
const getAllEmailSchedules = async () => {
	//In try block, we will try to execute our logic if works fine.
	try {
		const response = await axios.get(`${SERVER_URL}email-schedules?completed_ne=true`);
		//we are getting response back from server and storing in variable named as "data"
		const data = await response.data;
		return data;
	} catch (error) {
		console.log(error);
		//here we are catching the error, and returning it.
		return error;
	}
};

//***this method will send a get request to get all getAllEmailSchedules***
const getAllSlackSchedules = async () => {
	//In try block, we will try to execute our logic if works fine.
	try {
		const response = await axios.get(`${SERVER_URL}slack-schedules?completed_ne=true`);
		//we are getting response back from server and storing in variable named as "data"
		const data = await response.data;
		return data;
	} catch (error) {
		console.log(error);
		//here we are catching the error, and returning it.
		return error;
	}
};

//for contact
const getContactById = async (contactlist_id) => {
	//In try block, we will try to execute our logic if works fine.
	try {
		const response = await axios.get(`${SERVER_URL}contact-lists/${contactlist_id}`);
		//We are getting response back from server and storing in variable named as "data"
		const data = await response.data;
		return data;
	} catch (error) {
		console.log(error);
		//Here we are catching the error, and returning it.
		return error;
	}
};

//for email template
const getEmailTemplateById = async (emailtemplate_id) => {
	//In try block, we will try to execute our logic if works fine.
	try {
		const response = await axios.get(`${SERVER_URL}email-templates/${emailtemplate_id}`);
		//We are getting response back from server and storing in variable named as "data"
		const data = await response.data;
		//Here we are returing our variable that we will listen from the components
		// by which this service is being called.
		return data;
	} catch (error) {
		console.log(error);
		//Here we are catching the error, and returning it.
		return error;
	}
};

const getEmployeeByEmail = async (email) => {
	//In try block, we will try to execute our logic if works fine.
	try {
		const response = await axios.post(`${SERVER_URL}get_employees`, {
			email: email
		});
		//We are getting response back from server and storing in variable named as "data"
		const data = await response.data;
		//Here we are returing our variable that we will listen from the components
		// by which this service is being called.
		return data;
	} catch (error) {
		console.log(error);
		//Here we are catching the error, and returning it.
		return error;
	}
};

const sendEmails = async (from, to, subject, text, html) => {
	try {
		await node_mailer.sendMail(from, to, subject, text, html);
	} catch (error) {
		console.log(error);
	}
};

const updateEmailSchedulesById = async (emailSchId) => {
	//In try block, we will try to execute our logic if works fine.
	try {
		let id = emailSchId;
		const response = await axios.put(`${SERVER_URL}email-schedules/${id}`, {
			completed: true
		});
		//We are getting response back from server and storing in variable named as "data"
		const data = await response;

		//Here we are returing our variable that we will listen from the components
		//by which this service is being called.
		return data;
	} catch (error) {
		console.log(error);
		//Here we are catching the error, and returning it.
		return error;
	}
};

const updateSlackSchedulesById = async (id) => {
	//In try block, we will try to execute our logic if works fine.
	try {
		const response = await axios.put(`${SERVER_URL}slack-schedules/${id}`, {
			completed: true
		});
		//We are getting response back from server and storing in variable named as "data"
		const data = await response;

		//Here we are returing our variable that we will listen from the components
		//by which this service is being called.
		return data;
	} catch (error) {
		console.log(error);
		//Here we are catching the error, and returning it.
		return error;
	}
};

const getAllSlackMembers = async () => {
	try {
		// Call the users.list method using the WebClient
		const result = await client.users.list();
		if (result.ok === true) {
			let filtered_members = result.members.filter((rs) => rs.is_bot === false && rs.id != "USLACKBOT");

			return members_data;
		}
	} catch (error) {
		console.log(error);
	}
};

module.exports = {
	getAllEmailSchedules,
	getEmailTemplateById,
	getContactById,
	updateEmailSchedulesById,
	updateSlackSchedulesById,
	sendEmails,
	getEmployeeByEmail,
	getAllSlackSchedules,
	getAllSlackMembers
};

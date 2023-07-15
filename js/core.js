
var HOST = "http:///localhost:8000";
var API = "http://localhost:8080/api/v1";

function is_valid_access(token) {

	let exp = JSON.parse(atob(token.split(".")[1])).exp;
	if (exp == undefined || exp <= Date.now()/1000) {
		return false;
	}
	return true;
}

async function refresh(uid) {

	try {
		let account = JSON.parse(localStorage.getItem('account-list'))[uid];
		let refresh = account.tokens.refresh;

		let opt = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify({token: refresh})
		}

		var resp = await fetch(API + "/auth/refresh", opt);

	} catch(err){
		console.log(err);
		return false;
	}

	let res = null;
	try {
		res = await resp.json();
	} catch(err) {return false;}

	if (resp.status != 200) {
		return false;
	}

	return true;
}

async function send_req_with_token(url, method, data) {

	let uid = Number(localStorage.getItem('current-account'));
	let account = JSON.parse(localStorage.getItem('account-list'))[uid];

	if (!is_valid_access(account.tokens.access)) {
		console.log("invalid token");
		if (!await refresh(uid)) {
			window.open(HOST + "/auth.html", "_self");
		}
	}

	try {
		let opt = {
			method: method,
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
				'Authorization': "Bearer " + account.tokens.access
			}
		};

		if (method != 'GET' && data != null) {
			opt.body = JSON.stringify(data);
		}

		var resp = await fetch(url, opt);

	} catch(err){
		return null;
	}

	let res = null;
	try {
		res = await resp.json();
	} catch(err) { res = null;}


	return {code: resp.status, data: res};
}

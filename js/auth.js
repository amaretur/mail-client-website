
function only_number_validator(evt) {
	let theEvent = evt || window.event;
	let key = theEvent.keyCode || theEvent.which;
	key = String.fromCharCode( key );
	let regex = /[0-9]/;
	if( !regex.test(key) ) {
		theEvent.returnValue = false;
		if(theEvent.preventDefault) theEvent.preventDefault();
	}
}

function error(text) {

	let error_form = document.querySelector('.error');

	error_form.querySelector('.text').innerHTML = text;
	error_form.classList.add('show');

	setTimeout(function(){
		error_form.classList.remove('show');
	}, 3000);
}

async function send_req(url, method, data) {
	try {
		var resp = await fetch(url, {
			method: method,
			headers: {
				'Content-Type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify(data)
		});

	} catch(err){
		return undefined;
	}

	let res = null;
	try {
		res = await resp.json();
	} catch(err) { res = null;}

	return {code: resp.status, data: res};
}

function isValidMail(mail) {
	let reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
	return reg.test(mail)
}

function isEmpty(str) {
	return (!str || str.length === 0 || !str.trim());
}

function get_auth_data() {

	let username = document.querySelector('#username').value;
	if (!isValidMail(username)) {
		error("Некорректный почтовый адрес!")
		return null;
	}

	let password = document.querySelector('#password').value;
	if (isEmpty(password)) {
		error("Укажите пароль!");
		return null;
	}

	let imap_host = document.querySelector('#imap_host').value;
	if (isEmpty(imap_host)) {
		error("Укажите хост IMAP сервера!");
		return null;
	}

	let imap_port = document.querySelector('#imap_port').value;
	if (isEmpty(imap_port)) {
		error("Укажите порт IMAP сервера!");
		return null;
	}

	let smtp_host = document.querySelector('#smtp_host').value;
	if (isEmpty(smtp_host)) {
		error("Укажите хост SMTP сервера!");
		return null;
	}

	let smtp_port = document.querySelector('#smtp_port').value;
	if (isEmpty(smtp_port)) {
		error("Укажите порт SMTP сервера!");
		return;
	}

	return {
		username: username,
		password: password,
		setting: {
			imap_host: imap_host,
			imap_port: Number(imap_port),
			smtp_host: smtp_host,
			smtp_port: Number(smtp_port)
		}
	};
}

async function add_new_account() {

	let auth_data = get_auth_data();
	if (auth_data == null) {
		return;
	}

	let res = await send_req(API + "/auth/sign-in", "POST", auth_data);
	if (res == undefined || res.code != 200) {
		error("Не удалось добавить новую учетную запись!");
		return;
	}

	let accounts = JSON.parse(localStorage.getItem('account-list'));

	for (let i = 0; i < accounts.length; i++) {
			
		if (accounts[i].mail == auth_data.username) {
			accounts.splice(i, 1);
		}
	}

	accounts.push({
		mail: auth_data.username,
		tokens: res.data
	});

	localStorage.setItem('account-list', JSON.stringify(accounts));
	localStorage.setItem('current-account', accounts.length-1);

	document.querySelector('.add-new-account-form').classList.remove('show');

	await send_req_with_token(API + "/keys/verify?random", "PUT", null);
	window.open(HOST + "/", "_self");
}

function init() {

	let accounts = localStorage.getItem("account-list");
	if (accounts == null) {
		localStorage.setItem("account-list", "[]");
		return;
	}

	accounts = JSON.parse(accounts);
	if (accounts.length == 0) {
		document.querySelector('.account-list').innerHTML = `<div class="plug-empty">Вы не добавили ни одной учетной записи 🤷‍♂️</div>`;
		return;
	}

	let html = "";
	accounts.forEach(function (item, i, arr) {
		html += `
			<div onclick="auth_with_account(${i}, event);" class="account">
				<div class="account-body">
					<p class="logo">${item.mail.charAt(0).toUpperCase()}</p>
					<p class="username">${item.mail}</p>
				</div>
				<div onclick="show_warning('Удаление учетной записи приведет к удалению всех ключей шифрования!', delete_account, ${i});" class="btn-delete-account delete"><img class="delete" src="http://localhost:8000/icon/close-white.png" title="Удалить"></div>
			</div>`;
	});
	document.querySelector('.account-list').innerHTML = html;
}


function show_warning(text, func, arg) {

	let warning_form = document.querySelector('.warning');

	warning_form.querySelector('.text').innerHTML = text;
	warning_form.querySelector('.ok').onclick = function(){ 
		func(arg); 
		document.querySelector('.warning').classList.remove('show'); 
	};

	warning_form.classList.add('show');
}

function auth_with_account(id, event) {
	if (event.target.classList.contains('delete')) {
		return;
	}

	localStorage.setItem('current-account', id);
	window.open(HOST + "/", "_self");
}

async function delete_account(id) {

	let current_id = Number(localStorage.getItem('current-account'));

	localStorage.setItem('current-account', id);

	let res = await send_req_with_token(API + "/auth/account", "DELETE", null);
	if (res.code > 201) {
		error("Не удалось удалить аккаунт!");
		return;
	}

	let accounts = JSON.parse(localStorage.getItem('account-list'));
	accounts.splice(id, 1);
	localStorage.setItem('account-list', JSON.stringify(accounts));

	if (current_id == id) {
		localStorage.setItem('current-account', "-1");
	} else {
		localStorage.setItem('current-account', current_id);
	}

	init();
}

init();


var CURRENT_ACCOUNT_ID;
var CURRENT_ACCOUNT;

var FOLDERS = [];
var CURRENT_FOLDER_ID;

var MAILS;
var CURRENT_MAIL_ID;

var TOTAL = null;

var CURRENT_PAGE = 1;
var PAGE_SIZE = 7;

var PUT_FILES = [];

var MUTEX = true;

var PAGE = 1;
var PAGE_SIZE = 100;

function show_warning(text, func, arg) {

	let warning_form = document.querySelector('.warning');

	warning_form.querySelector('.text').innerHTML = text;
	warning_form.querySelector('.ok').onclick = function(){ 
		func(arg); 
		document.querySelector('.warning').classList.remove('show'); 
	};

	warning_form.classList.add('show');
}

async function update_verify(arg) {

	let res = await send_req_with_token(API + "/keys/verify?random", "PUT", null);
	if (res == undefined || res.code != 200) {
		error('Не удалось обновить ключи шифрования!');
		document.querySelector('.warning').classList.remove('show');
		return;
	}

	res = await send_req_with_token(API + "/keys/verify", "GET", null);
	console.log(res);
	if (res == undefined || res.code != 200) { 
		error("Не удалось получить ключи ЭЦП!");
	} else {
		document.querySelector('.verify-pub').innerHTML = res.data.public == "" ? 'Пусто...' : res.data.public.replace(/[\n]/gi, '<br>');
		document.querySelector('.verify-priv').innerHTML = res.data.private == "" ? 'Пусто...' : res.data.private.replace(/[\n]/gi, '<br>');
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

function init_account_logo() {
	let logo = document.querySelector('.account-logo');
	logo.innerHTML = CURRENT_ACCOUNT.mail.charAt(0).toUpperCase();
	logo.title = CURRENT_ACCOUNT.mail;
}

async function init() {

	CURRENT_ACCOUNT_ID = Number(localStorage.getItem('current-account'));
	if (CURRENT_ACCOUNT_ID == -1) {
		window.open(HOST + "/auth.html", "_self");
	}

	CURRENT_ACCOUNT = JSON.parse(
		localStorage.getItem('account-list')
	)[CURRENT_ACCOUNT_ID];

	init_account_logo();

	let res = await send_req_with_token(API + "/keys/verify", "GET", null);
	console.log(res);
	if (res == undefined || res.code != 200) { 
		error("Не удалось получить ключи ЭЦП!");
	} else {
		document.querySelector('.verify-pub').innerHTML = res.data.public == "" ? 'Пусто...' : res.data.public.replace(/[\n]/gi, '<br>');
		document.querySelector('.verify-priv').innerHTML = res.data.private == "" ? 'Пусто...' : res.data.private.replace(/[\n]/gi, '<br>');
	}

	res = await send_req_with_token(API + "/keys?offset=" + (PAGE-1)*PAGE_SIZE + "&limit=" + PAGE_SIZE, "GET", null);
	if (res == undefined || res.code != 200) { 
		error("Не удалось получить перечень диалогов!");
	} else {
		if (res.data.sets.length == 0) {
			document.querySelector('.dialog-list').innerHTML = "<p class='plag-sets'>Тут пока что пусто...</p>"
		} else {

			let html = "";
			res.data.sets.forEach(function(item, i, arr){
					html += `<div onclick="get_keys_by_id(${item.id});" class="dialog">
								<div class="icon">
									<img src="http://localhost:8000/icon/key.png">
								</div>
								<p class="interlocutor">Собеседник:</p>
								<p class="mail">${item.interlocutor}</p>
							</div>`
			});
			document.querySelector('.dialog-list').innerHTML = html;
		}
	}
}

async function get_keys_by_id(id) {

	let res = await send_req_with_token(API + "/keys/" + id, "GET", null);
	if (res == undefined || res.code != 200) {
		error("Не удалось получить ключи диалога!");
		return;
	}

	let keys = document.querySelector('.dialog-key-form');
	keys.querySelector('.verify').innerHTML = res.data.verify == "" ? "Пусто..." : res.data.verify.replace(/[\n]/gi, '<br>');
	keys.querySelector('.shared').innerHTML = res.data.shared == "" ? "Пусто..." : res.data.shared.replace(/[\n]/gi, '<br>');

	keys.querySelector('.encrypt').innerHTML = res.data.encrypt == "" ? "Пусто..." : res.data.encrypt.replace(/[\n]/gi, '<br>');
	keys.querySelector('.decrypt').innerHTML = res.data.decrypt == "" ? "Пусто..." : res.data.decrypt.replace(/[\n]/gi, '<br>');
	keys.classList.add('show');
}

init();


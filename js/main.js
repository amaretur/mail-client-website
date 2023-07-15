
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

function isValidMail(mail) {
	let reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
	return reg.test(mail)
}

function isEmpty(str) {
	return (!str || str.length === 0 || !str.trim());
}

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

function info(text) {

	let info_form = document.querySelector('.info-form');

	info_form.querySelector('.text').innerHTML = text;
	info_form.classList.add('show');

	setTimeout(function(){
		info_form.classList.remove('show');
	}, 3000);
}


function init_account_logo() {
	let logo = document.querySelector('.account-logo');
	logo.innerHTML = CURRENT_ACCOUNT.mail.charAt(0).toUpperCase();
	logo.title = CURRENT_ACCOUNT.mail;

	let account_menu = document.querySelector('.account-menu-form');
	account_menu.querySelector('.mail').innerHTML = CURRENT_ACCOUNT.mail;
	account_menu.querySelector('.logo').innerHTML = CURRENT_ACCOUNT.mail.charAt(0).toUpperCase();
}

async function init_folder_list() {
	let res = await send_req_with_token(API + "/mail/folder", "GET", null);
	if (res == undefined || res.code >= 400) {
		error("Не удалось получить перечень папок!<br>Обновите страницу!");
		return;
	}
	FOLDERS = res.data;

	let html = "";
	FOLDERS.forEach(function(item, i, arr) {
		html += `<div onclick="open_folder('${item.id}');" id="${item.id}" class="folder">
			<img class="icon" src="http://localhost:8000/icon/mailbox.png">
			<p class="name">${item.name}</p>
			<p class="total"></p>
		</div>`;
	});

	document.querySelector('.folder-list').innerHTML = html;
}

function get_html(mail) {

	for(let i = 0; i < mail.files.length; i++) {
		if (mail.files[i].is_html) {
			return mail.files[i].data;
		}
	}
}

function render_mails(mails) {

	console.log(mails);

	if (mails.length == 0) {
		document.querySelector('.mail-list').innerHTML = `<p class="plug-mail">Ящик пуст... 🤷‍♂️</p>`;
		return;
	}

	let html = "";
	mails.forEach(function (item, i, arr) {

		let name = item.from_name == "" ? item.from_mail : item.from_name;

		html += `<div id="${i}" onclick="check_mail(${i});" class="mail">
				<div class="from">
					<div class="icon ${item.error != undefined ? 'with-error' : item.subject == '@share' ? 'with-key' : ''}">
					${item.error != undefined ? '!' : item.subject == '@share' ? '<img src="http://localhost:8000/icon/key-white.png">' : name.charAt(0).toUpperCase()}
					</div>
					<p class="name">${name}</p>
				</div>
				<div class="body">
					<p class="subject">${item.subject == "" ? 'Без темы' : item.subject == '@share' ? 'Ключи шифрования' : item.subject}</p>
					<xmp class="lead">${item.subject == '@share' ? '' : get_html(item).slice(0, 100).replace(/<\/?[^>]+(>|$)/g, "").replace(/&n[a-z]*[;]*/gi,' ')}</xmp>
				</div>
				${ item.files.length-1 == 0 ? `<p class="attach-count empty"></p>` : `<p class="attach-count">${item.files.length-1}</p>`}
				<p class="date-time">${item.date} ${item.time}</p>
			</div>`;
	});

	document.querySelector('.mail-list').innerHTML = html;
}

async function go_to_page(page) {

	MUTEX = false;

	CURRENT_PAGE = page;
	document.querySelector('.mail-list').innerHTML = `<p class="plug-mail">Загрузка писем...</p>`;

	let res = await send_req_with_token(
		API + "/mail?folder=" + CURRENT_FOLDER_ID + 
		"&offset=" + (page-1)*PAGE_SIZE + "&limit=" + PAGE_SIZE, 
		"GET",
		null
	);
	if (res == undefined || res.code != 200) {
		error("Не удалось получить перечень писем!");
		document.querySelector('.mail-list').innerHTML = `<p class="plug-mail">Упсс...</p>`;
		document.getElementById(CURRENT_FOLDER_ID).querySelector('.total').innerHTML = "Ошибка...";
		MUTEX = true;
		return;
	}

	document.getElementById(CURRENT_FOLDER_ID).querySelector('.total').innerHTML = res.data.total;

	let total = Math.ceil(res.data.total/PAGE_SIZE);
	if (total == 0) {
		total++;
	}

	document.querySelector('.pagin .page-num').innerHTML = `${CURRENT_PAGE}/${total}`
	MAILS = res.data.mails;
	render_mails(MAILS);
	TOTAL = total;
	MUTEX = true;
}

function next() {
	if (!MUTEX) {
		return;
	}

	if (CURRENT_PAGE >= TOTAL) {
		return;
	}

	go_to_page(CURRENT_PAGE + 1);
}

function prev() {
	if (!MUTEX) {
		return;
	}

	if (CURRENT_PAGE == 1) {
		return;
	}

	go_to_page(CURRENT_PAGE - 1);
}

async function open_folder(id) {

	if (!MUTEX) {
		return;
	}
	MUTEX = false;

	CURRENT_FOLDER_ID = id;

	document.getElementById(CURRENT_FOLDER_ID).querySelector('.total').innerHTML = "Загрузка...";
	document.querySelector('.pagin .page-num').innerHTML = "Загрузка...";

	let current = document.querySelector('.current');
	if (current != undefined) {
		current.classList.remove('current');
	}

	document.getElementById(CURRENT_FOLDER_ID).classList.add('current');
	go_to_page(1);
}

function capitalizeFirstLetter(string) {
	 return string.charAt(0).toUpperCase() + string.slice(1);
}

function check_mail(id) {

	if (!MUTEX) {
		return;
	}

	MUTEX = false;

	CURRENT_MAIL_ID = id;

	let check_mail_form = document.querySelector('.check-mail-form');
	let mail = MAILS[id];

	let error_frame = check_mail_form.querySelector('.error-mail');
	if (mail.error != undefined) {
		error_frame.querySelector('p').innerHTML = "WARNING! " + capitalizeFirstLetter(mail.error);
		error_frame.classList.add('show');
	} else {
		error_frame.classList.remove('show');
	}

	check_mail_form.querySelector('.subject').innerHTML = mail.subject == "" ? 'Без темы' : mail.subject == '@share' ? 'Ключи шифрования' : mail.subject;
	if (mail.subject == '@share') {
		check_mail_form.querySelector('.subject').classList.add('with-key');
	} else {
		check_mail_form.querySelector('.subject').classList.remove('with-key');
	}
	
	check_mail_form.querySelector('.date-time').innerHTML = `${mail.date} ${mail.time}`;
	check_mail_form.querySelector('.from-mail').innerHTML = mail.from_mail;

	if (mail.from_name != "") {
		check_mail_form.querySelector('.from-name').innerHTML = mail.from_name;
	} else {
		check_mail_form.querySelector('.from-name').innerHTML = "Без имени";
	}

	check_mail_form.querySelector('.body').innerHTML = mail.subject == '@share' ? `Данное письмо содержит ключи шифрования и верификации ЭЦП от пользователя <i>${mail.from_mail}</i>` : get_html(mail);

	let html;
	if (mail.files.length - 1 != 0) {

		html = `<h3>Вложения:</h3><div class="attach-list">`;

		mail.files.forEach(function(item, i, arr){

			if (item.is_html) {
				return;
			}

			html += `<a title="${item.name}" download="${item.name}" href="data:application/octet-stream;base64,${item.data}" class="attachment">
						<img src="http://localhost:8000/icon/attach.png">
						<div class="attach-name">${item.name}</div>
					</a>`;
		});

		html += `</div>`;

	} else {
		html = "";
	}

	if (mail.subject == "@share") {
		check_mail_form.querySelector('.receive-key').classList.add('show');
	} else {
		check_mail_form.querySelector('.receive-key').classList.remove('show');
	}

	check_mail_form.querySelector('.attach').innerHTML = html;

	document.querySelector('.check-mail-form').classList.add('show');

	MUTEX = true;
}

function clear_send_form() {

	document.querySelector('.send-mail .form_to').value = "";
	document.querySelector('.send-mail .form_subj').value = "";

	PUT_FILES = [];
	document.querySelector('.put-file').setAttribute("data-count", PUT_FILES.length);

	contentEditor.setData("");
}

async function send_mail() {

	let to_mail = document.querySelector('.send-mail .form_to').value;

	if (!isValidMail(to_mail)) {
		error("Укажите корректный почтовый адрес!");
		return;
	}

	document.querySelector('.send-mail .header p').innerHTML = "Отправка...";

	let subject = document.querySelector('.send-mail .form_subj').value;

	let is_sign = document.querySelector('.sign').classList.contains('use');
	let is_encrypt = document.querySelector('.enc').classList.contains('use');

	let html = contentEditor.getData();

	let files = JSON.parse(JSON.stringify(PUT_FILES));
	files.push({
		name: "body.html",
		is_html: true,
		data: contentEditor.getData()
	});

	let data = {
		sign: is_sign,
		encrypt: is_encrypt,
		mail: {
			subject: subject,
			to_mail: to_mail,
			files: files
		}
	};

	let res = await send_req_with_token(API + "/mail", "POST", data);
	if (res == undefined || res.code != 200) {
		console.log(res);
		if (res != undefined && res.data.error != undefined) {
			if (res.data.error == "error not found keys") {
				error("Отсутствуют необходимые ключи!");
			}
			error(res.data.error);
			document.querySelector('.send-mail .header p').innerHTML = "Новое письмо...";
			return;
		}
		error("Не удалось отправить сообщение!");
		document.querySelector('.send-mail .header p').innerHTML = "Новое письмо...";
		return;
	}

	document.querySelector('.send-mail .header p').innerHTML = "Новое письмо...";
	document.querySelector('.send-mail').classList.remove('show');
	clear_send_form();

	info("Письмо отправлено!");
}

function put_file() {
	let f = document.querySelector("input.attach").files[0];

	var reader = new FileReader();
	reader.readAsDataURL(f);
	reader.onload = function () {
		PUT_FILES.push({name: f.name, is_html: false, data: reader.result.split(",")[1]});
		document.querySelector('.put-file').setAttribute("data-count", PUT_FILES.length);
		f.value = null;
	};
}

async function share() {
	let mail = document.querySelector('.share-form input').value;
	if (!isValidMail(mail)) {
		error("Некорректный адрес электронной почты!");
		return;
	}

	document.querySelector('.share-form .ok').innerHTML = "ОТПРАВКА...";

	let res = await send_req_with_token(API + "/keys/share", "POST", {recipient: mail});
	if (res == undefined || res.code != 200) {
		error("Не удалось поделиться ключами шифрования!");
		return;
	}

	document.querySelector('.share-form .ok').innerHTML = "ОТПРАВИТЬ";
	document.querySelector('.share-form').classList.remove('show');

	info(`Ключи шифрования успешно отправлены! (получ.: ${mail})`);
}

async function receive_key() {

	document.querySelector('.receive-key').innerHTML = "Обработка...";

	html = get_html(MAILS[CURRENT_MAIL_ID]);
	let data = JSON.parse(html);

	data.interlocutor = MAILS[CURRENT_MAIL_ID].from_mail;

	let res = await send_req_with_token(API + "/keys/receive", "POST", data);
	if (res == undefined || res.code != 200) {
		error("Не удалось принять ключи!");
		return;
	}

	document.querySelector('.receive-key').innerHTML = "Принять ключи шифрования";
	document.querySelector('.check-mail-form').classList.remove('show');
	info("Ключи шифрования получены!")
}

function account_menu_toggle() {

	document.querySelector('.setting-form').classList.remove('show');
	document.querySelector('.account-menu-form').classList.toggle('show');
}

async function setting() {

	let form = document.querySelector('.setting-form');
	if (form.classList.contains('show')) {
		form.classList.remove('show');
		return;
	}

	document.querySelector('.account-menu-form').classList.remove('show');

	let res = await send_req_with_token(API + "/setting", "GET", null);
	if (res == undefined || res.code != 200) {
		return;
	}

	form.querySelector('.smtp-host').value = res.data.smtp_host;
	form.querySelector('.smtp-port').value = res.data.smtp_port;
	form.querySelector('.imap-host').value = res.data.imap_host;
	form.querySelector('.imap-port').value = res.data.imap_port;

	form.classList.add('show');
}

async function save_setting() {

	let form = document.querySelector('.setting-form');

	let sh = form.querySelector('.smtp-host').value;
	let sp = form.querySelector('.smtp-port').value;
	let ih = form.querySelector('.imap-host').value;
	let ip = form.querySelector('.imap-port').value;

	if (isEmpty(sh)) {
		error("Укажите хост smtp сервера!");
		return;
	}

	if (isEmpty(ih)) {
		error("Укажите хост imap сервера!");
		return;
	}

	if (isEmpty(sp)) {
		error("Укажите порт smtp сервера!");
		return;
	}

	if (isEmpty(ip)) {
		error("Укажите порт imap сервера!");
		return;
	}

	let res = await send_req_with_token(API + "/setting", "PUT", {
		imap_host: ih,
		imap_port: Number(ip),
		smtp_host: sh,
		smtp_port: Number(sp)
	});

	if (res == undefined || res.code != 200) {
		error("Ошибка при изменения настроек!");
		return;
	}

	form.classList.remove('show');
	info("Настройки клиента успешно изменены!");
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
	await init_folder_list();
	if (FOLDERS.length != 0) {
		await open_folder(FOLDERS[0].id);
	}
}

init();

var contentEditor = null;

ClassicEditor
	.create( document.querySelector( '#editor' ) )
	.then(editor => { contentEditor = editor; })
	.catch( error => {
		console.error( error );
	});

/*
	jshint config
		browser: true,
		devel: true,
		undef: true,
		node: true,
		laxbreak: true,
		jquery: true,
		esnext:true,
		globals:{},
		globalstrict:false,
		quotmark:true,
		unused:false
*/

// main configuration

if(typeof(api_token) == 'undefined') var api_token='';
if(typeof(profiles) == 'undefined') var profiles={};
var user={}; user.token = api_token;

var app = {
	ver: 2.5,
	channel: 'beta', // master or beta
	update_uri: 'https://github.com/seiya-dev/VK-Video-Uploader/archive/',
	video_max_size: 2147483648,
	boolean:{
		videobox_open: false,
		alertbox_open: false,
		videouploader_ready: false,
		massuploder_ready: false
	}
};

var api = {
	app_id: 4218952,
	ver: 5.29,
	api_lang: 'en',
	required_access: 327696,
	required_access_string: 'video,groups,offline',
	auth_uri_prefix: 'https://oauth.vk.com/authorize?client_id=',
	auth_uri_suffix1: '&display=page&redirect_uri=',
	auth_uri_suffix2: '&response_type=token&scope=',
	redirect_uri: 'http://vk.com/blank.html'
};

api.req = function(method, params, cb) {
	var cbname='',par='',script = document.createElement('script');
	for (var p in params) {
		par += encodeURIComponent(p) + '=' + encodeURIComponent(params[p]) + '&';
	}
	cbname = '__json'+Math.floor(Math.random()*1000001);
	window[cbname] = function(data) { script.remove(); delete window[cbname]; cb(data); };
	script.src  = 'https://api.vk.com/method/'+method+'?'+par;
	script.src += 'v='+api.ver+'&lang='+api.api_lang+'&access_token='+api_token+'&callback='+cbname;
	document.getElementsByTagName('head')[0].appendChild(script);
};

// functions

function $(selector,el) {
	 if (!el) {el = document;}
	 return el.querySelector(selector);
}

Element.prototype.append = function(html){
	this.insertAdjacentHTML('beforeend',html);
};

Element.prototype.remove = function(){
	this.parentElement.removeChild(this);
};
NodeList.prototype.remove = function() {
	for(var i = 0, len = this.length; i < len; i++) {
		if(this[i] && this[i].parentElement) {
			this[i].parentElement.removeChild(this[i]);
		}
	}
};

function field2text(inputText) {
	var replacedText;
	replacedText = inputText.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
	return replacedText;
}

function toggle(el) {
	el.style.display = (el.style.display == 'none') ? '' : 'none';
}

// alert box

function openAlertBox(text,button){

	app.boolean.alertbox_open = true;
	
	$('body').style.overflow = 'hidden';
	$('#alertbg').style.visibility = 'visible';
	
	// text box
	$('#alerttext').innerHTML = text;
	
	// buttons
	var alert_button = '';
	button.forEach(function(data,index){
		alert_button += '<button class="button" onclick="'+button[index][0]+'">'+button[index][1]+'</button>';
	});
	$('#alertbuttons').innerHTML = alert_button;
	
	// margin
	$('#alertbox').style.marginLeft = '-' + ($('#alertbox').offsetWidth/2) +'px';
	$('#alertbox').style.marginTop = '-' + ($('#alertbox').offsetHeight/2) +'px';
	
}

function closeAlertBox(){
	app.boolean.alertbox_open = false;
	$('#alertbox').style.marginLeft = '';
	$('#alertbox').style.marginTop = '';
	$('#alerttext').innerHTML = '';
	$('#alertbuttons').innerHTML = '';
	$('#alertbg').style.visibility = 'hidden';
	if(!app.boolean.videobox_open){
		$('body').style.overflow = 'auto';
	}
}

function selAllText(el){el.focus();el.select();}

// start app

if (window.addEventListener) {
	window.addEventListener('load',prepUser,false);
}
else if(window.attachEvent) {
	window.attachEvent('onload',prepUser); // ms ie fix
}
else{
	window.onload = prepUser;
}

window.onbeforeunload = function confirmExit(){
	return 'Страница просит вас подтвердить, что вы хотите уйти — при этом загружаемые вами видеофайлы могут не сохраниться.';
};

function prepUser(){
	if(api_token.length==85 && /^[a-z0-9]*$/.test(api_token)){
		vkCheckPermission();
	}
	else{
		authFailed();
	}
}

function authFailed(){
	api.auth_uri = api.auth_uri_prefix+api.app_id+api.auth_uri_suffix1+api.redirect_uri+api.auth_uri_suffix2+api.required_access_string;
	$('.ln1').style.textAlign = 'center';
	$('.ln1').append('<div>Добро пожаловать!</div>');
	$('.ln1').append('<div>Ошибка: нет доступа к видеозаписям и/или группам VK.</div>');
	$('.ln1').append('<div>[ <a href="'+api.auth_uri+'" target="_blank">Авторизироватся с помощью VK</a> ]</div>');
	$('.ln1').append('<div>После авторизации вставьте ваш <strong>access_token</strong> в фаил <strong>vk_key.js</strong>.</div>');
}

function vkCheckPermission(){
	api.req('account.getAppPermissions',{},function(data){
		if(data.response || data.response === 0 ){
			user.permissions = data.response;
			if((user.permissions&(api.required_access))==(api.required_access)){
				loadUser();
				checkVersion();
			}
			else{
				authFailed();
			}
		}
		else{
			authFailed();
		}
	});
}

function checkVersion(){
	api.req('execute.checkVideoUploderLatestVersion',{channel:app.channel},function(data){
		// console.log(data);
		if(data.response && !data.response.error){
			var warning_oldver_tooltip = 'Ваша версия: '+app.ver+'. Версия на сервере: '+data.response.ver+'.';
			var warning_oldver = 'Ваша версия устарела. '
								+'<a title="'+warning_oldver_tooltip+'" href="'+app.update_uri+app.channel+'.zip">Скачать последнию</a>.';
			// console.log(data.response.ver > app.ver);
			if(data.response.ver > app.ver){
				$('.ln2').append('<span>'+warning_oldver+'</span>');
			}
		}
	});
}

function loadUser(){
	api.req('users.get',{fields:'first_name,last_name,photo_50,domain'},function(data){
		if(data.response){
			
			user.id = data.response[0].id;
			user.first_name = data.response[0].first_name;
			user.last_name = data.response[0].last_name;
			user.domain = data.response[0].domain;
			user.photo_50 = data.response[0].photo_50;
			
			$('.ava').style.backgroundImage = 'url("'+user.photo_50+'")';
			$('.ava').style.height = '50px';
			$('.ava').style.width = '50px';
			
			var welcome_msg = '<span>Добро пожаловать, <a href="http://vk.com/'+user.domain+'" target="_blank">'+user.first_name+' '+user.last_name+'</a>!</span>';
			$('.ln1').append(welcome_msg);
			$('.ln1').style.padding = '5px 0 6px';
			
			$('#right_nav').innerHTML='<select onchange="selectUploaderProfile();" id="profiles"><select>';
			
			profiles.forEach(function(data,index){
				if(typeof(data.name) != 'undefined' && data.name !== ''){
					$('#profiles').append('<option value="'+index+'">'+data.name+'</option>');
				}
			});
			
			$('#right_nav').append(' <span id="spoilerAddVideo" class="button" onclick="toggleAddVideo();">-</a></span>');
			
			selectMainUploaderProfile();
			
		}
	});
}

function toggleAddVideo(){
	if($('#adding_box').style.display == 'none'){
		$('#adding_box').style.display = 'block';
		$('#spoilerAddVideo').innerHTML='-';
	}
	else{
		$('#adding_box').style.display = 'none';
		$('#spoilerAddVideo').innerHTML='+';
	}
}

function selectMainUploaderProfile(){
	loadUploaderProfile($('#profiles option').value);
	addEvent();
}
function selectUploaderProfile(){
	loadUploaderProfile($('#profiles').value);
}

function loadUploaderProfile(ui_profileid){
	
	app.ui_profileid = ui_profileid;
	$('#adding_box').style.display='block';
	
	var addUploaderBoxTitle = ''
							+ '<span class="page_title page_addvideo">'
							+ '<select class="UpUI" onchange="loadUploaderUI($(\'.UpUI\').value,'+ui_profileid+');">'
								+ '<option value="profile" '+( 
									isNaN(profiles[ui_profileid].togroup) || profiles[ui_profileid].togroup < 1 ?'selected="selected"':''
								)+'>Добавить видео в профаил:</otion>'
								+ '<option value="group" '+( 
									!isNaN(profiles[ui_profileid].togroup) && profiles[ui_profileid].togroup > 0 ?'selected="selected"':''
								)+'>Добавить видео в сообщество:</otion>'
							+ '</select>'
							+ '</span>'
							+ '<span class="manag">'
								+ '<input id="remember" type="checkbox" checked="checked" title="Не сбрасывать поля после добавления видео"/>'
							+ '</span>';
	
	$('.title').innerHTML=addUploaderBoxTitle;
	
	if( !isNaN(profiles[ui_profileid].togroup) && profiles[ui_profileid].togroup > 0 ){
		loadUploaderUI('group');
	}
	else{
		loadUploaderUI('profile');
	}
	
}

function loadUploaderUI(ui){
	
	$('.add_up').innerHTML='';
	var video_title = typeof profiles[app.ui_profileid].defaultVideoTitle !== 'undefined' ? profiles[app.ui_profileid].defaultVideoTitle : '';
	var video_discription = typeof profiles[app.ui_profileid].defaultVideoDiscription !== 'undefined' ? profiles[app.ui_profileid].defaultVideoDiscription : '';
	var priv_param_text = 'Для последующей отправки видеозаписи личным сообщением.\n'
						 + 'Выбранный альбом игнорируется.\n'
						 + 'После загрузки с этим параметром видеозапись\n'
						 + 'не будет отображаться в списке видеозаписей пользователя\n'
						 + 'и не будет доступна другим пользователям по id.\n'
						 + '(Использование данной опции не рекомендуется)';
	var param_is_private_button_html = '<input class="extra_option" name="is_private" type="checkbox" '+(profiles[app.ui_profileid].is_private==1?'checked="checked"':'')+'>'
									 + '<a href="#" title="'+priv_param_text+'" onclick="return false;">Приватное видео</a>';
	var param_is_private_button = ui == 'profile' || ui == 'group' && profiles[app.ui_profileid].privForGroup == 1 ? param_is_private_button_html : '';
	var param_additionalSetting = '<span>Дополнительные настройки:</span>'
						  + '<input class="extra_option" name="wallpost" type="checkbox" '+(profiles[app.ui_profileid].wallpost==1?'checked="checked"':'')+'>'
						  + '<a href="#" title="После обработки видео, запостить его на стену." onclick="return false;">Опубликовать на стену</a>'
						  + '<input class="extra_option" name="repeat" type="checkbox">'
						  + '<a href="#" title="Зацикливание воспроизведения видеозаписи." onclick="return false;" '+(profiles[app.ui_profileid].repeat==1?'checked="checked"':'')+'>Зациклить видео</a>'
						  + param_is_private_button;
	var videotitle_field = '<div>'
						+ '<div><span>Название видеофайла<span class="rStar" title="Обязательное поле">*</span>:</span></div>'
						+ '<div><input class="w686 block" type="text" name="name" required="required" value="'+field2text(video_title)+'"/></div>'
				+ '</div>';
	var videodiscription_field = '<div>'
							+ '<span>Описание видеофайла:</span>'
							+ '<div><input class="w686 block" type="text" name="description" value="'+field2text(video_discription)+'"/></div>'
						  + '</div>';
	var goButtonCreateUploader = '<div id="addUploader" class="border button w686" onclick="prepUploaderBox();">Перейти к загрузке [Enter]</div>';
	
	if(ui=='profile'){
		// uploader ready?
		app.boolean.videouploader_ready = true;
		// set privacy
		var privView = !isNaN(profiles[app.ui_profileid].privView) && profiles[app.ui_profileid].privView > -1 && profiles[app.ui_profileid].privView < 4 ?
							profiles[app.ui_profileid].privView : 0;
		var privComment = !isNaN(profiles[app.ui_profileid].privComment) && profiles[app.ui_profileid].privComment > -1 && profiles[app.ui_profileid].privComment < 4 ?
							profiles[app.ui_profileid].privComment : 0;
		var privacyString = ['Все пользователи (по умолчанию)','Только друзья','Друзья и друзья друзей','Только я'];
		var privacyViewStringHTML = '', privacyCommentStringHTML = '';
		privacyString.forEach(function(string,index){
				privacyViewStringHTML += '<option value="'+index+'" '+(privView==index?'selected="selected"':'')+'>'+privacyString[index]+'</option>';
				privacyCommentStringHTML += '<option value="'+index+'" '+(privComment==index?'selected="selected"':'')+'>'+privacyString[index]+'</option>';
		});
		// load ui
		var profileAddUI = '<div id="video_add">'
						 + videotitle_field
						 + videodiscription_field
						 + '<div class="albumCustom"></div>'
						 + '<table class="w688">'
							 + '<tr>'
								 + '<td>'
									 + '<div>Кто сможет смотреть это видео?</div>'
									 + '<select name="privacy_view" class="border w340">'
										 + privacyViewStringHTML
									 + '</select>'
								 + '</td>'
								 + '<td>'
									 + '<div>Кто сможет комментировать это видео?</div>'
									 + '<select name="privacy_comment" class="border w340">'
										 + privacyCommentStringHTML
									 + '</select>'
								 + '</td>'
							 + '</tr>'
						 + '</table>'
						 + '<div class="tRight">'
							 + param_additionalSetting
						 + '</div>'
						 + '<div>'
							 + goButtonCreateUploader
						 + '</div>'
					 + '</div>';
		$('.add_up').innerHTML = profileAddUI;
		loadAlbums();
	}
	
	else if(ui=='group'){
		app.boolean.videouploader_ready = true;
		var groupAddUI = '<div id="video_add">'
							+'<div class="groupCustom"></div>'
							+videotitle_field
							+videodiscription_field
							+'<div class="albumCustom"></div>'
							+'<div class="tRight">'
								+param_additionalSetting
							+'</div>'
							+'<div>'
								+goButtonCreateUploader
							+'</div>'
						+'</div>';
		$('.add_up').innerHTML=groupAddUI;
		loadGroupsExtraUI();
	}
	
}

function addEvent(){
	window.addEventListener('keydown',function(e){
		if(e.keyCode === 13 && app.boolean.videouploader_ready && !app.boolean.videobox_open && !app.boolean.alertbox_open) {
			prepUploaderBox();
		}
	});
}

function loadAlbums(add_albumid){
	var albumCustomAddUI = '<div>'
							+ '<span>Выберите в какой альбом сохранять видео:</span>'
							+ '<span class="fRight">[ <a href="#" id="createAlbum" onclick="addAlbum(); return false;">Создать альбом</a> ]</span>'
						+ '<select class="albumList w684 border" name="album_id"><select>';
	$('.albumCustom').innerHTML = albumCustomAddUI;
	var albums_owner = $('.gr_list') ? -$('.gr_list').value : user.id;
	var album_id = 0;
	if(typeof(add_albumid)=='undefined'){
		album_id = !isNaN(profiles[app.ui_profileid].toalbum) && profiles[app.ui_profileid].toalbum > -1 ? profiles[app.ui_profileid].toalbum : 0;
	}
	else{
		album_id = add_albumid;
	}
	api.req('video.getAlbums',{owner_id:albums_owner,count:1},function(albumsdata){
		if(albumsdata.response){
			var totalAlbums = Math.ceil(albumsdata.response.count/100);
			loadAlbumsList(album_id,totalAlbums);
		}
		else if(albumsdata.error){
			$('.albumList').innerHTML='';
			$('.albumList').append('<option value="0">Ошибка #'+albumsdata.error.error_code+': '+albumsdata.error.error_msg+'</option>');
		}
	});
}

function addAlbum(text){
	text = typeof text !== 'undefined' ? text : '';
	openAlertBox(
		'<div>Введите название альбома:<br/><input type="text" name="toAlbumLoad" class="toAlbumLoad w528" value=""/></div>'+text,
		[['toAlbumLoad();','Создать'],['closeAlertBox();','Отмена']]
	);
}
function deleteAlbum(album_id){
	// new feature!
}

function toAlbumLoad(){
	var load_album_name = $('.toAlbumLoad').value;
	var to_groupid = $('.gr_list') ? -$('.gr_list').value : 0;
	api.req('video.addAlbum',{group_id:to_groupid,title:load_album_name},function(createdata){
		if(createdata.response){
			loadAlbums(createdata.response.album_id);
			closeAlertBox();
		}
		else if(createdata.error){
			addAlbum('<div class="rStar">Ошибка #'+createdata.error.error_code+':<br/>'+createdata.error.error_msg+'</div>');
		}
	});
}

function loadAlbumsList(album_id,totalAlbums){
	
	var to_ownerid = $('.gr_list') ? -$('.gr_list').value : user.id;
	$('.albumList').innerHTML='';
	$('.albumList').append('<option value="0" '+(album_id===0?'selected="selected"':'')+'>Вне альбома</option>');
	
	var albumIndex = 0;
	var albumsListOffset = 0;
	
	var albumLoader = function(){
		if( albumIndex < totalAlbums ){
			api.req('video.getAlbums',{owner_id:to_ownerid,count:100,offset:albumsListOffset},function(albumslistdata){
				if(albumslistdata.response){
					albumslistdata.response.items.forEach(function(data,index){
						$('.albumList').append('<option value="'+albumslistdata.response.items[index].id+'" '+(albumslistdata.response.items[index].id==album_id?'selected="selected"':'')+'>'+albumslistdata.response.items[index].title+'</option>');
					});
					albumIndex++; albumsListOffset=albumIndex*100;
					setTimeout(function(){albumLoader();},200);
				}
			});
		}
	};
	albumLoader();
	
}

function loadGroupsExtraUI(){
	if( $('.groupCustom') ){
		var groupCustomUI = '<div>'
								+ '<div>'
									+ '<span>Выберите куда сохранять видео:</span>'
									+ '<span class="fRight">'
										+ '<span>[ <a href="#" onclick="massAddUploaderBoxes(); return false;">Доб. несколько видео</a> ]</span> '
										+ '<span>[ <a href="#" onclick="selectGroupById(); return false;">Выбор сообщества по ID</a> ]</span> '
										+ '<span id="goToGroup"></span> '
									+ '</span>'
								+ '</div>'
								+ '<div>'
									+ '<select name="group_id" class="gr_list w684 border" onchange="changeLinkToGroupAndAlbumList();"></select>'
								+ '</div>'
							+ '</div>';
		$('.groupCustom').innerHTML = groupCustomUI;
		buildGroupList(profiles[$('#profiles').value].togroup);
	}
}

function buildGroupList(group_id){
	// cleanup
	$('.gr_list').innerHTML = '';
	// get groups count 
	api.req('groups.get',{filter:'moder',count:1},function(groups_data){
		// console.log(groups_data);
		if (groups_data.response) {
			var groups_count = groups_data.response.count;
			groupsListPreLoader(group_id,groups_count);
		}
		else {
			openAlertBox('Неизвестная ошибка.',[['closeAlertBox();','Закрыть']]);
			console.log(groups_data.error);
		}
	});
	function groupsListPreLoader (group_id,groups_count) {
		// console.log(group_id,groups_count);
		var groupsIndex = 0;
		var groupsListOffset = 0;
		var groupsListLoader = function(){
			// console.log(groupsIndex,groupsListOffset,groups_count);
			if( groupsListOffset < groups_count ){
				api.req('groups.get',{filter:'moder',count:1000,extended:1,offset:groupsListOffset},function(groupslistdata){
					if(groupslistdata.response){
						groupslistdata.response.items.forEach(function(data,index){
							$('.gr_list').append('<option value="'+groupslistdata.response.items[index].id+'" '+(groupslistdata.response.items[index].id==group_id?'selected="selected"':'')+'>'+field2text(groupslistdata.response.items[index].name)+'</option>');
						});
						groupsIndex++; groupsListOffset=groupsIndex*1000;
						setTimeout(function(){groupsListLoader();},200);
					}
					else{
						openAlertBox('Неизвестная ошибка.',[['closeAlertBox();','Закрыть']]);
						console.log(groupslistdata.error);
					}
				});
			}
			else{
				if( typeof(group_id) != 'undefined' ){
					api.req('groups.getById',{group_id:group_id},function(group_isMember){
						if(group_isMember.response){
							if (group_isMember.response[0].is_admin < 1 || group_isMember.response[0].is_member < 1) {
								$('.gr_list').append('<option value="'+group_isMember.response[0].id+'" selected="selected">'+field2text(group_isMember.response[0].name)+'</option>');
							}
							goToGroupLink();
							loadAlbums();
						}
						else{
							openAlertBox('Неизвестная ошибка.',[['closeAlertBox();','Закрыть']]);
							console.log(group_isMember.error);
						}
					});
				}
				else{
					goToGroupLink();
					loadAlbums();
				}
			}
		};
		groupsListLoader();
	}
}

function changeLinkToGroupAndAlbumList(){
	goToGroupLink();
	loadAlbums();
}

function goToGroupLink(){
	$('#goToGroup').innerHTML = '[ <a href="http://vk.com/club'+($('.gr_list').value)+'" target="_blank">VK</a> ]';
}

function selectGroupById(group_id,text){
	group_id = typeof text !== 'undefined' ? group_id : $('.gr_list').value;
	text = typeof text !== 'undefined' ? text : '';
	openAlertBox(
		'<div>Введите ID сообщества:<br/><input type="number" class="selectGroupById w528" value="'+(group_id)+'" min="1"/></div>'+text,
		[['selectionGroupById();','Перейти'],['closeAlertBox();','Отмена']]
	);
}

function selectionGroupById(){
	var selected_group_by_id = $('.selectGroupById').value;
	if( !isNaN(selected_group_by_id) && selected_group_by_id > 0 ){
		closeAlertBox();
		buildGroupList(selected_group_by_id);
	}
	else{
		selectGroupById(selected_group_by_id,'<div class="rStar">Ошибка: неверный ID сообщества.</div>');
	}
}

function prepUploaderBox(){
	
	var param = {}; // параметры:
	param.group_id = $('.gr_list') ? $('.gr_list').value : 0; // oid = 0 ; текущий пользователь
	param.title = $('[name="name"]').value === '' ? 'No name' : $('[name="name"]').value;
	param.description = $('[name="description"]').value;
	param.album_id = Number($('[name="album_id"]').value);
	param.wallpost = $('[name="wallpost"]').checked ? 1 : 0;
	param.repeat = $('[name="repeat"]').checked ? 1 : 0;
	if(param.group_id < 1){
		param.privacy_view = $('[name="privacy_view"]').value;
		param.privacy_comment = $('[name="privacy_comment"]').value;
		param.is_private = $('[name="is_private"]').checked ? 1 : 0;
	}
	else{
		param.privacy_view = 0;
		param.privacy_comment = 0;
		param.is_private = !isNaN(profiles[app.ui_profileid].privForGroup) && profiles[app.ui_profileid].privForGroup == 1 ? ( $('[name="is_private"]').checked ? 1 : 0 ) : 0;
	}
	
	reqUploaderBox(param.group_id,param.title,param.description,param.album_id,param.wallpost,param.repeat,param.privacy_view,param.privacy_comment,param.is_private);
	
	if(!$('#remember').checked){
		$('#video_add').reset();
	}

}

var vUpl = {}, vUplID = -1;
function reqUploaderBox(group_id,title,description,album_id,wallpost,repeat,privacy_view,privacy_comment,is_private){
	var json_request = {
		group_id:group_id,
		name:title,
		description:description,
		album_id:album_id,
		wallpost:wallpost,
		repeat:repeat,
		privacy_view:privacy_view,
		privacy_comment:privacy_comment,
		is_private:is_private
	};
	api.req('execute.videoSave',json_request,function(updata){

		if(updata.response.uploader_data){
			
			vUplID++;
			vUpl[vUplID] = updata.response.uploader_data;
			vUpl[vUplID].embed_code = updata.response.embed_code.replace(/&api_hash=[^&]*/,'');
			
			var video_url='<a class="url" href="http://vk.com/video'+vUpl[vUplID].owner_id+'_'+vUpl[vUplID].video_id+'" target="_blank">'+field2text(vUpl[vUplID].title)+' (video'+vUpl[vUplID].owner_id+'_'+vUpl[vUplID].video_id+')</a>';
			
			var load_video_js = 'loadVideo(\''+vUpl[vUplID].owner_id+'_'+vUpl[vUplID].video_id+'\',\''+vUpl[vUplID].access_key+'\'); return false;';
			
			var fileuploaderboxui = '<div class="file_uploader" id="vfubox'+vUpl[vUplID].video_id+'">'
								  + '<div class="title">'
									  + '<div>'
										  + '<span>Загрузка видео:</span>'
										  + '<span class="manag">'
											  + '<span class="button" title="Показать видео" onclick="'+load_video_js+'">i</span>'
											  + '<span class="button" title="Скрыть/показать загрузчик" onclick="toggle($(\'#upl'+vUpl[vUplID].video_id+'\')); return false;">_</span>'
											  + '<span class="button" title="Удалить загрузчик" onclick="$(\'#vfubox'+vUpl[vUplID].video_id+'\').remove(); return false;">x</span>'
										  + '</span>'
									  + '</div>'
									  + '<div style="clear:both;"></div>'
									  + '<div>'+video_url+'</div>'
									  + '<div><input class="w688 marginTop5" value="'+vUpl[vUplID].embed_code+'" readonly="readonly" onclick="selAllText(this);"></input></div>'
								  + '</div>'
								  + '<div class="add_up" id="upl'+vUpl[vUplID].video_id+'">'
									  + '<div id="pr'+vUpl[vUplID].video_id+'" class="progress"></div>'
									  + '<div>'
										  + '<form id="form'+vUpl[vUplID].video_id+'" enctype="multipart/form-data" method="POST" target="fr'+vUpl[vUplID].video_id+'" action="'+vUpl[vUplID].upload_url+'">'
											  + '<input id="file'+vUpl[vUplID].video_id+'" type="file" name="video_file" accept="video/*,audio/*" class="w686"/>'
											  + '<div data-id="'+vUpl[vUplID].video_id+'" class="border button" onclick="runUpload(this);">Загрузить</div>'
										  + '</form>'
									  + '</div>'
									  + '<div>'
										  + '<iframe class="upframe border0 borderbox w688" onload="iframeload('+vUpl[vUplID].video_id+',1)" name="fr'+vUpl[vUplID].video_id+'"></frame>'
									  + '</div>'
								  + '</div>';
			
			$('#main').append(fileuploaderboxui);
			
		}
		else if(updata.execute_errors){
			openAlertBox('<div>Ошибка #'+updata.execute_errors[0].error_code+':<br/>'+updata.execute_errors[0].error_msg+'</div>',[['closeAlertBox();','Закрыть']]);
			app.boolean.massuploder_ready = false;
		}
		
	});
}

function iframeload(id,stat) {

	var htmltxt,htmlpad,htmlcolor,htmlbgcolor;
 
	if(stat==1){htmlbgcolor='white';}
	else if(stat==2){htmltxt='No input file.';htmlbgcolor='red';htmlpad='5px';htmlcolor='white';}
	else if(stat==3){htmltxt='File too big (max size: '+app.video_max_size+' bytes).';htmlbgcolor='red';htmlpad='5px';htmlcolor='white';}
	else{htmltxt='Loading...';htmlbgcolor='orange';htmlpad='5px';}
 
	$('#pr'+id).style.padding=htmlpad || '';
	$('#pr'+id).style.color=htmlcolor || '';
	$('#pr'+id).innerHTML=htmltxt || '';
	$('#pr'+id).style.backgroundColor=htmlbgcolor || '';
	
}

function runUpload(upButton){
	
	var fdid = upButton.dataset.id;
	
	if( !$('#file'+fdid).files[0] ){
		iframeload(fdid,2);
	}
	else if( $('#file'+fdid).files[0].size > app.video_max_size ){
		iframeload(fdid,3);
	}
	else{
		iframeload(fdid,0);
		$('#form'+fdid).submit();
	}

}

// info box

function loadVideo(video,key){
	api.req("video.get",{videos:video+'_'+key,count:1},function(vdata){
		if(vdata.response.count !== 0){
			// console.log(vdata.response);
			var videobox_json = vdata.response.items[0];
			if(typeof(key)!='undefined'){
				videobox_json.access_key = key;
			}
			openPlayerBox(videobox_json);
		}
		else{
			openAlertBox('Видео не найдено.',[['closeAlertBox();','Закрыть']]);
		}
		if(vdata.error){
			openAlertBox('Ошибка #'+vdata.error.error_code+': '+vdata.error.error_msg,[['closeAlertBox();','Закрыть']]);
		}
	});
}

function openPlayerBox(json){
	// console.log(json);
	var playerBoxUI = ''
					+ '<div class="frame"><iframe src="'+json.player.replace(/&api_hash=[^&]*/,'')+'"></iframe></div>'
					+ '<div class="info" id="videoData">'
						+ '<div>Title: <input value="'+field2text(json.title)+'" readonly="readonly"/></div>'
						+ '<div>Description: <textarea style="height:44px;" type="text" readonly="readonly">'+field2text(json.description)+'</textarea></div>'
						+ '<div>Preview (130x 97): <input value="'+json.photo_130+'" readonly="readonly"/></div>'
						+ '<div>Preview (320x240): <input value="'+json.photo_320+'" readonly="readonly"/></div>'
						+ (json.photo_640?
						  '<div>Preview (640x480): <input value="'+json.photo_640+'" readonly="readonly"/></div>':'')
						+ (json.photo_800?
						  '<div>Preview (800x450): <input value="'+json.photo_800+'" readonly="readonly"/></div>':'')
						+ '<div><a href="#" onclick="loadVideo(\''+json.owner_id+'_'+json.id+'\',\''+json.access_key+'\'); return false;"> Перезагрузить фрейм </a></div>'
					+ '</div>'
					+ '';
	$('#videobox').innerHTML = playerBoxUI;
	$('body').style.overflow = 'hidden';
	$('#videobg').style.display = 'block';
	$('#videobox').style.display = 'block';
	$('#videobg').onclick = function(){hideVideoBox();};
	app.boolean.videobox_open = true;
}
function hideVideoBox(){
	$('#videobox').innerHTML = '';
	$('#videobox').style.display = 'none';
	$('#videobg').style.display = 'none';
	$('body').style.overflow = 'auto';
	app.boolean.videobox_open = false;
}

function massAddUploaderBoxes(){
	
	var priv_param_text = 'Для последующей отправки видеозаписи личным сообщением.\n'
						+ 'Выбранный альбом игнорируется.\n'
						+ 'После загрузки с этим параметром видеозапись\n'
						+ 'не будет отображаться в списке видеозаписей пользователя\n'
						+ 'и не будет доступна другим пользователям по id.\n'
						+ '(Использование данной опции не рекомендуется)';
	var param_is_private_button_html = '<input class="extra_option" name="is_private" type="checkbox" '+(profiles[app.ui_profileid].is_private==1?'checked="checked"':'')+'>'
									 + '<a href="#" title="'+priv_param_text+'" onclick="return false;">Приватное видео</a>';
	var param_is_private_button = $('.UpUI').value == 'profile' || $('.UpUI').value == 'group' && profiles[app.ui_profileid].privForGroup == 1 ? param_is_private_button_html : '';
	var param_additionalSetting = '<span>Дополнительные настройки:</span>'
						  + '<input class="extra_option" name="wallpost" type="checkbox" '+(profiles[app.ui_profileid].wallpost==1?'checked="checked"':'')+'>'
						  + '<a href="#" title="После обработки видео, запостить его на стену." onclick="return false;">Опубликовать на стену</a>'
						  + '<input class="extra_option" name="repeat" type="checkbox">'
						  + '<a href="#" title="Зацикливание воспроизведения видеозаписи." onclick="return false;" '+(profiles[app.ui_profileid].repeat==1?'checked="checked"':'')+'>Зациклить видео</a>'
						  + param_is_private_button;
	
	var releaseTeam = typeof profiles[$('#profiles').value].releaseTeam != 'undefined' ? profiles[$('#profiles').value].releaseTeam : '';
	var videoTitleTemplate = typeof profiles[$('#profiles').value].videoTitleTemplate != 'undefined' ? profiles[$('#profiles').value].videoTitleTemplate : '[%group%] %title_en% | %title_ru% [%episode%] [%traslator%]';
	var massAddUploaderBoxesUI = '<div class="form">'
									+ '<div>Сообщество:</div>'
									+ '<div class="tLeft">'
										+ '<input class="w120" type="number" id="mu_group_id" value="'+$('.gr_list').value+'" disabled="disabled"/>'
										+ '<span class="marginLeft5">'+field2text( $('.gr_list').options[$('.gr_list').selectedIndex].text )+'</span>'
									+ '</div>'
									+ '<div>Шаблон название видео:</div>'
									+ '<div><input class="w686" type="text" id="mu_video_title" value="'+field2text(videoTitleTemplate)+'"/></div>'
									+ '<div>Релиз от:</div>'
									+ '<div><input class="w686" type="text" id="mu_releaser" value="'+field2text(releaseTeam)+'"/></div>'
									+ '<div>Название (Романзи/Английское)<span class="rStar" title="Обязательное поле">*</span>:</div>'
									+ '<div><input class="w686" type="text" id="mu_title_en" required="required" value=""/></div>'
									+ '<div>Название (Русское):</div>'
									+ '<div><input class="w686" type="text" id="mu_title_ru" value=""/></div>'
									+ '<div id="massAddNums">'
										+'<div id="massAddNumStart">'
											+ '<div>Начинать с эпизода #<span class="rStar" title="Обязательное поле">*</span></div>'
											+ '<div><input class="w227" type="number" id="mu_start" required="required" value="1"/></div>'
										+'</div>'
										+'<div id="massAddNumEnd">'
											+ '<div>Закончить на эпизоде #<span class="rStar" title="Обязательное поле">*</span></div>'
											+ '<div><input class="w227" type="number" id="mu_end" required="required" value="12"/></div>'
										+'</div>'
										+'<div id="massAddNumLength">'
											+ '<div>Цифр в номере эп. (2 или 3)<span class="rStar" title="Обязательное поле">*</span>:</div>'
											+ '<div><input class="w227" type="number" id="mu_numep" required="required" value="2"/></div>'
										+'</div>'
									+ '</div>'
									+ '<div>Перевод / Озвучка:</div>'
									+ '<div><input class="w686" type="text" id="mu_translate" value=""/></div>'
									+ '<div>Альбом:</div>'
									+ '<div class="tLeft">'
										+ '<input class="w120" type="number" id="mu_album_id" value="'+($('.albumList').value)+'" disabled="disabled"/>'
										+ '<span class="marginLeft5">'+field2text($('.albumList').options[$('.albumList').selectedIndex].text)+'</span>'
									+ '</div>'
									+ '<div id="mass_extra" style="text-align:right;">'
										+ param_additionalSetting
									+ '</div>'
								+'</div>';
								
	openAlertBox(
		massAddUploaderBoxesUI,
		[['massUploderBoxTest();','Добавить'],['closeAlertBox();','Закрыть']]
	);
	
}

function massUploderBoxTest(){
	
	var massvideodata = {};
	app.boolean.videouploader_ready = true;
	
	if( !isNaN($('#mu_group_id').value) && parseInt($('#mu_group_id').value,10) > 0 && app.boolean.videouploader_ready){
		massvideodata.group_id = parseInt($('#mu_group_id').value,10);
	}
	else if(app.boolean.videouploader_ready){
		MassUploderBoxError(1);
		app.boolean.videouploader_ready = false;
	}
	
	if( isNaN($('#mu_start').value) && parseInt($('#mu_start').value,10) < 0 && app.boolean.videouploader_ready){
		MassUploderBoxError(2);
		app.boolean.videouploader_ready = false;
	}
	
	if( isNaN($('#mu_end').value) && parseInt($('#mu_end').value,10) < 0 && app.boolean.videouploader_ready){
		MassUploderBoxError(2);
		app.boolean.videouploader_ready = false;
	}
	
	if( parseInt($('#mu_start').value,10) < 1 && app.boolean.videouploader_ready){
		MassUploderBoxError(5);
		app.boolean.videouploader_ready = false;
	}
	
	if( parseInt($('#mu_end').value,10) < parseInt($('#mu_start').value,10) && app.boolean.videouploader_ready){
		MassUploderBoxError(3);
		app.boolean.videouploader_ready = false;
	}
	
	if( parseInt($('#mu_end').value,10) > 999 && app.boolean.videouploader_ready){
		MassUploderBoxError(4);
		app.boolean.videouploader_ready = false;
	}
	
	// $('#mu_video_title').value
	if ( 
		$('#mu_video_title').value.indexOf('%title_en%') == -1 
		// || $('#mu_video_title').value.indexOf('%title_ru%') == -1 
		|| $('#mu_video_title').value.indexOf('%episode%') == -1
	){
		MassUploderBoxError(7);
		app.boolean.videouploader_ready = false;
	}
	
	if(app.boolean.videouploader_ready){
		massvideodata.title_template = $('#mu_video_title').value;
		massvideodata.releaser = $('#mu_releaser').value;
		massvideodata.title_en = $('#mu_title_en').value;
		massvideodata.title_ru = $('#mu_title_ru').value;
		massvideodata.start_ep = parseInt($('#mu_start').value,10);
		massvideodata.end_ep = parseInt($('#mu_end').value,10);
		massvideodata.numep = parseInt($('#mu_numep').value,10);
		massvideodata.translate = $('#mu_translate').value;
		massvideodata.album = $('.albumList').value;
		massvideodata.wallpost = $('#mass_extra [name="wallpost"]').checked ? 1 : 0;
		massvideodata.repeat = $('#mass_extra [name="repeat"]').checked ? 1 : 0;
		massvideodata.priv = profiles[$('#profiles').value].privForGroup == 1 ? (  $('#mass_extra [name="is_private"]').checked ? 1 : 0 ) : 0;
		doMassAddUpload(
			massvideodata.title_template,
			massvideodata.group_id,
			massvideodata.releaser,
			massvideodata.title_en,
			massvideodata.title_ru,
			massvideodata.start_ep,
			massvideodata.end_ep,
			massvideodata.numep,
			massvideodata.translate,
			massvideodata.album,
			massvideodata.wallpost,
			massvideodata.repeat,
			massvideodata.priv
		);
		closeAlertBox();
	}
	
}

function MassUploderBoxError(errorcode){
	var massboxerror = {};
	switch (errorcode){
		case 1:
			massboxerror.text = 'ID группы не число или меньше 1.';
			break;
		case 2:
			massboxerror.text = 'Номер эпизода не число.';
			break;
		case 3:
			massboxerror.text = 'Конечный эпизод меньше чем начальный.';
			break;
		case 4:
			massboxerror.text = 'Максимальное количество серий 999.';
			break;
		case 5:
			massboxerror.text = 'Можно начинать только с первой серии.';
			break;
		case 7:
			massboxerror.text = 'Шаблон название видео должен содержать %title_en% и %episode% (Обязательные поля).';
			break;
		default:
			massboxerror.text = 'Неизвестная ошибка.';
	}
	openAlertBox(
		'Ошибка'+(errorcode?' #'+errorcode:'')+': '+massboxerror.text,
		[['massAddUploaderBoxes();','Попробывать ещё раз']]
	);
}

function doMassAddUpload(
		title_template,
		to_id,
		relgroup,
		titlejp,
		titleru,
		epns,
		epnt,
		epnn,
		tr,
		album,
		wallpost,
		repeat,
		priv
	){

	var updb = {};
	app.boolean.massuploder_ready = true;
	
	// основная замена
	updb.title_template = title_template.replace('%title_en%',titlejp);
	
	// доп замены // [%group%] %title_en% | %title_ru% [%episode%] [%traslator%]
	updb.title_template = updb.title_template.indexOf('%group%') != -1 ? updb.title_template.replace('%group%',relgroup) : updb.title_template;
	updb.title_template = updb.title_template.indexOf('%title_ru%') != -1 ? updb.title_template.replace('%title_ru%',titleru) : updb.title_template;
	updb.title_template = updb.title_template.indexOf('%traslator%') != -1 ? updb.title_template.replace('%traslator%',tr) : updb.title_template;
	console.log(updb.title_template);
	
	// confug
	updb.group = to_id;
	updb.album_id = album;
	updb.wallpost = wallpost;
	updb.repeat = repeat;
	updb.priv = priv;
	
	// nums
	updb.ep_first = epns;
	updb.ep_total = epnt+1;
	updb.ep_numbers = !isNaN(epnn) ? ( epnn>3||epnn==3||epnt>99 ? 3 : ( epnn<2 ? 2 : 2 )) : 2;
	
	var lpad = function(str, len) {
		str = str + ''; var z = '0', plen = len - str.length;
		return plen <= 0 ? str : new Array(plen + 1).join(z) + str;
	};
	
	function doAddEps(){
		if(updb.ep_total>updb.ep_first && app.boolean.massuploder_ready){
			var episode_num = lpad(updb.ep_first,updb.ep_numbers);
			var vkvideo_title = updb.title_template.replace('%episode%',episode_num);
			reqUploaderBox(updb.group,vkvideo_title,'',updb.album_id,updb.wallpost,updb.repeat,0,0,updb.priv);
			updb.ep_first = updb.ep_first + 1;
			setTimeout(function(){doAddEps();},1000);
		}
		else{
			app.boolean.massuploder_ready = true;
		}
	}
	
	if(!isNaN(updb.ep_first) && !isNaN(updb.ep_total)){
		doAddEps();
	}

}
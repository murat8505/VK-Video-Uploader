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
	ver: 2.2,
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
	$('#alertbox').style.marginLeft = '-' + (($('#alerttext').offsetWidth+2)/2) +'px';
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
			
			$('#right_nav').append(' <a style="width:16px;" id="spoilerAddVideo" class="btn" href="#" onclick="toggleAddVideo();">-</a>');
			
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
	return false;
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
		//$('.add_up').innerHTML = '<div style="text-align:center;">Not implemented yet</div>';
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
						 '</div>';
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

function addAlbum(txt){
	txt = typeof txt !== 'undefined' ? txt : '';
	openAlertBox(
		'<div>Введите название альбома:<br/><input type="text" name="toAlbumLoad" class="toAlbumLoad w528" value=""/></div>'+txt,
		[
			['toAlbumLoad();','Создать'],
			['closeAlertBox();','Отмена']
		]
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
										//+ '<span>[ <a href="#" onclick="MassUploderBox(); return false;">Доб. несколько видео</a> ]</span> '
										//+ '<span>[ <a href="#" onclick="toGroup(); return false;">Выбор сообщества по ID</a> ]</span> '
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
			openAlertBox('Неизвестная ошибка.',[['closeAlertBox();','Отмена']]);
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
						openAlertBox('Неизвестная ошибка.',[['closeAlertBox();','Отмена']]);
						console.log(groupslistdata.error);
					}
				});
			}
			else{
				api.req('groups.isMember',{group_id:group_id},function(group_isMember){
					if(group_isMember.response === 0 || group_isMember.response == 1){
						// console.log(group_isMember.response);
						if (group_isMember.response != 1) {
							api.req('groups.getById',{group_id:group_id},function(extraGroup){
								if(group_isMember.response){
									$('.gr_list').append('<option value="'+extraGroup.response[0].id+'" selected="selected">'+field2text(extraGroup.response[0].name)+'</option>');
								}
								else{
									openAlertBox('Неизвестная ошибка.',[['closeAlertBox();','Отмена']]);
									console.log(group_isMember.error);
								}
							});
						}
						goToGroupLink();
						loadAlbums();
					}
					else{
						openAlertBox('Неизвестная ошибка.',[['closeAlertBox();','Отмена']]);
						console.log(group_isMember.error);
					}
				});
			}
		}
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

// groupname mass uploader
// $('.gr_list').options[$('.gr_list').selectedIndex].text
var L=$('#sList'),cache,divs={},cur=null,C=$('.content');
initI18n();
function split(t){return t.replace(/^\s+|\s+$/g,'').split(/\s*\n\s*/).filter(function(e){return e;});}
function getName(d,n,def){
	d.title=n||'';
	d.innerHTML=n?n.replace(/&/g,'&amp;').replace(/</g,'&lt;'):(def||'<em>'+_('labelNoName')+'</em>');
}

// Main options
function allowUpdate(n){return n.update&&(n.custom.updateURL||n.meta.updateURL);}
function setIcon(n,d){
	var c=cache[n.meta.icon];
	d.src=c?'data:image/x;base64,'+btoa(c):'images/icon64.png';
}
function modifyItem(r){
	var d=divs[r.id],n=bg.metas[r.id],o;
	if(r.message) d.querySelector('.message').innerHTML=r.message;
	d.className=n.enabled?'':'disabled';
	var a=d.querySelector('.update');
	if(a) a.disabled=r.updating;
	a=d.querySelector('.name');
	getName(a,n.custom.name||n.meta.name);
	if(o=n.custom.homepage||n.meta.homepage) a.href=o;
	if(n.meta.author) d.querySelector('.author').innerText=_('labelAuthor')+n.meta.author;
	a=d.querySelector('.descrip');
	getName(a,n.meta.description||'','&nbsp;');
	setIcon(n,d.querySelector('.icon'));
	a=d.querySelector('.enable');
	a.innerHTML=n.enabled?_('buttonDisable'):_('buttonEnable');
}
function loadItem(n,r){
	var d=divs[n.id];if(!r) r={id:n.id};
	d.innerHTML='<img class=icon>'
	+'<a class="name ellipsis" target=_blank></a>'
	+'<span class=version>'+(n.meta.version?'v'+n.meta.version:'')+'</span>'
	+'<span class=author></span>'
	+'<div class=panelT>'
		+'<span class=move data=move>&equiv;</span>'
	+'</div>'
	+'<p class="descrip ellipsis"></p>'
	+'<div class=panelB>'
		+'<button data=edit>'+_('buttonEdit')+'</button> '
		+'<button data=enable class=enable></button> '
		+'<button data=remove>'+_('buttonRemove')+'</button> '
		+(allowUpdate(n)?'<button data=update class=update>'+_('anchorUpdate')+'</button> ':'')
		+'<span class=message></span>'
	+'</div>';
	modifyItem(r);
}
function addItem(o){
	var d=divs[o.id]=document.createElement('div');
	loadItem(o);
	L.appendChild(d);
}
(function(){
	function getSource(e){
		var o=e.target,p,i;
		for(p=o;p&&p.parentNode!=L;p=p.parentNode);
		i=Array.prototype.indexOf.call(L.childNodes,p);
		return [i,p,o];
	}
	function moveItem(e){
		var m=getSource(e);if(m[0]<0) return;
		if(m[0]>=0&&m[0]!=t) {
			e=m;m=e[1];if(e[0]>t) m=m.nextSibling;
			L.insertBefore(o[1],m);
			t=e[0];
		}
	}
	function movedItem(e){
		if(!moving) return;moving=false;
		o[1].classList.remove('moving');
		L.onmousemove=L.onmouseup=null;L.onmousedown=startMove;
		if(o[0]!=t) bg.move(o[0],t);
	}
	function startMove(e){
		o=getSource(e);t=o[0];
		if(o[2].getAttribute('data')=='move') {
			if(moving) return;moving=true;
			e.preventDefault();
			o[1].classList.add('moving');
			L.onmousedown=null;
			L.onmousemove=moveItem;
			L.onmouseup=movedItem;
		}
	}
	var maps={
		edit:function(i){
			bg.editScript(bg.ids[i],edit);
		},
		enable:function(i,p,o){
			var id=bg.ids[i],s=bg.metas[id];
			bg.enableScript(id,!s.enabled);
		},
		remove:function(i,p){
			bg.removeScript(i);
			L.removeChild(p);
		},
		update:function(i){
			bg.checkUpdate(bg.ids[i]);
		}
	},o,t,moving=false;
	L.onmousedown=startMove;
	L.onclick=function(e){
		var o=getSource(e),d=o[2].getAttribute('data'),f=maps[d];
		if(f) {
			e.preventDefault();
			f.apply(this,o);
		}
	};
})();
$('#bNew').onclick=function(){edit(bg.newScript());};
$('#bUpdate').onclick=bg.checkUpdateAll;
function switchTab(e){
	var t=e.target,i=t.id.slice(2),o=C.querySelector('#tab'+i);
	if(!o) return;
	if(cur) {
		if(cur.tab==o) return;
		cur.menu.classList.remove('selected');
		cur.tab.classList.add('hide');
	}
	cur={menu:t,tab:o};
	t.classList.add('selected');
	o.classList.remove('hide');
	switch(i) {	// init
		case 'Settings':xLoad();break;
	}
}
$('.sidemenu').onclick=switchTab;
switchTab({target:$('#smInstalled')});
function confirmCancel(dirty){
	return !dirty||confirm(_('confirmNotSaved'));
}

// Advanced
var H=$('#iImport'),S=$('#tSearch'),V=$('#bVacuum');
$('#cShow').checked=bg.settings.showButton;
$('#cShow').onchange=function(){bg.showButton(bg.setOption('showButton',this.checked));};
$('#cUpdate').checked=bg.settings.autoUpdate;
$('#cUpdate').onchange=function(){if(bg.setOption('autoUpdate',this.checked)) bg.autoCheck();};
S.value=bg.settings.search;
S.title=_('hintSearchLink');
S.onchange=function(){bg.setOption('search',S.value);};
$('#bDefSearch').onclick=function(){S.value=_('defaultSearch');S.onchange();};
$('#aImport').onchange=function(e){
	var i,f,files=e.target.files;
	for(i=0;f=files[i];i++) {
		var r=new FileReader();
		r.onload=function(e){impo(e.target.result);};
		r.readAsBinaryString(f);
	}
};
V.onclick=function(){
	var t=this;t.disabled=true;t.innerHTML=_('buttonVacuuming');
	bg.vacuum(function(){t.innerHTML=_('buttonVacuumed');});
};
V.title=_('hintVacuumData');

// Import
function impo(b){
	var z=new JSZip();
	try{z.load(b);}catch(e){alert(_('msgErrorZip'));return;}
	var vm=z.file('ViolentMonkey'),count=0;
	if(vm) try{vm=JSON.parse(vm.asText());}catch(e){vm={};opera.postError('Error parsing ViolentMonkey configuration.');}
	z.file(/\.user\.js$/).forEach(function(o){
		if(o.dir) return;
		var v,i,c={code:o.asText()};
		try{
			if(vm.scripts&&(v=vm.scripts[o.name.slice(0,-8)])) {
				delete v.id;c.more=v;
			}
			bg.parseScript(null,c);
			count++;
		}catch(e){opera.postError('Error importing data: '+o.name+'\n'+e);}
	});
	if(vm.values) for(z in vm.values) bg.setValue(null,{uri:z,data:vm.values[z]});
	if(vm.settings) for(z in vm.settings)
		if(z in bg.settings) bg.setOption(z,vm.settings[z]);
	alert(_('msgImported',[count]));
	location.reload();
}

// Export
var xL=$('#xList'),xE=$('#bExport'),xD=$('#cWithData');
xD.checked=bg.settings.withData;
function xLoad() {
	xL.innerHTML='';xE.disabled=false;
	bg.ids.forEach(function(i){
		var d=document.createElement('div'),n=bg.metas[i];
		d.className='ellipsis';
		getName(d,n.custom.name||n.meta.name);
		xL.appendChild(d);
	});
}
xD.onchange=function(){bg.setOption('withData',this.checked);};
xL.onclick=function(e){
	var t=e.target;
	if(t.parentNode!=this) return;
	t.classList.toggle('selected');
};
$('#bSelect').onclick=function(){
	var c=xL.childNodes,v,i;
	for(i=0;i<c.length;i++) if(!c[i].classList.contains('selected')) break;
	v=i<c.length;
	for(i=0;i<c.length;i++) if(v) c[i].classList.add('selected'); else c[i].classList.remove('selected');
};
function getNameURI(c){
	var t=c.meta.namespace||'',n=c.meta.name||'',ckey=escape(t)+':'+escape(n)+':';
	if(!t&&!n) ckey+=c.id;return ckey;
}
xE.onclick=function(){
	this.disabled=true;this.innerHTML=_('buttonExporting');
	var z=new JSZip(),n,_n,names={},c,i,j,ns={},_ids=[],
			vm={scripts:{},settings:bg.settings};
	function finish(v){
		if(v) vm.values=v;
		z.file('ViolentMonkey',JSON.stringify(vm));
		c={compression:'DEFLATE'};
		n=z.generate(c);
		bg.opera.extension.tabs.create({url:'data:application/zip;base64,'+n}).focus();
	}
	for(i=0;i<bg.ids.length;i++)
		if(xL.childNodes[i].classList.contains('selected')) _ids.push(bg.ids[i]);
	bg.getScripts(_ids,false,function(o){
		o.forEach(function(c){
			n=_n=c.custom.name||c.meta.name||'Noname';j=0;
			while(names[n]) n=_n+(++j);names[n]=1;
			z.file(n+'.user.js',c.code);
			vm.scripts[n]={id:c.id,custom:c.custom,enabled:c.enabled,update:c.update};
			if(xD.checked) ns[c.uri]=1;
		});
		if(xD.checked) bg.getValues(Object.getOwnPropertyNames(ns),finish);
		else finish();
	});
};

// Script Editor
var E=$('#wndEditor'),U=$('#eUpdate'),M=$('#eMeta'),
		mN=$('#mName'),mH=$('#mHomepage'),mR=$('#mRunAt'),
		mU=$('#mUpdateURL'),mD=$('#mDownloadURL'),
    mI=$('#mInclude'),mE=$('#mExclude'),mM=$('#mMatch'),
    cI=$('#cInclude'),cE=$('#cExclude'),cM=$('#cMatch'),
		eS=$('#eSave'),eSC=$('#eSaveClose'),T,sC=$('#sCustom');
function markClean(){
	eS.disabled=eSC.disabled=true;
}
function mReset(){
	M.classList.add('hide');
	sC.innerHTML='&laquo;';
	var e=[],c=E.scr.custom;M.dirty=false;
	mN.value=c.name||'';
	mH.value=c.homepage||'';
	mU.value=c.updateURL||'';
	mD.value=c.downloadURL||'';
	switch(c['run-at']){
		case 'document-start':mR.value='start';break;
		case 'document-idle':mR.value='idle';break;
		case 'document-end':mR.value='end';break;
		default:mR.value='default';
	}
	cI.checked=c._include!=false;
	mI.value=(c.include||e).join('\n');
	cM.checked=c._match!=false;
	mM.value=(c.match||e).join('\n');
	cE.checked=c._exclude!=false;
	mE.value=(c.exclude||e).join('\n');
}
function edit(o){
	E.classList.remove('hide');
	E.scr=o;U.checked=o.update;
	T.setValueAndFocus(o.code);
	T.clearHistory();markClean();mReset();
}
function eSave(){
	if(eS.disabled) return;	// in case fired by Ctrl-S
	if(M.dirty) {
		var c=E.scr.custom;
		c.name=mN.value;
		c.homepage=mH.value;
		c.updateURL=mU.value;
		c.downloadURL=mD.value;
		switch(mR.value){
			case 'start':c['run-at']='document-start';break;
			case 'idle':c['run-at']='document-idle';break;
			case 'end':c['run-at']='document-end';break;
			default:delete c['run-at'];
		}
		c._include=cI.checked;
		c.include=split(mI.value);
		c._match=cM.checked;
		c.match=split(mM.value);
		c._exclude=cE.checked;
		c.exclude=split(mE.value);
	}
	bg.parseScript(null,{
		id:E.scr.id,
		code:T.getValue(),
		message:'',
		more:{
			custom:E.scr.custom,
			update:U.checked
		}
	});
	markClean();
}
function mClose(){M.classList.add('hide');}
function eClose(){E.classList.add('hide');E.scr=null;}
U.onchange=E.markDirty=function(){eS.disabled=eSC.disabled=false;};
M.markDirty=function(){M.dirty=true;E.markDirty();};
[mN,mH,mR,mU,mD,mI,mM,mE,cI,cM,cE].forEach(function(i){i.onchange=M.markDirty;});
$('#bCustom').onclick=function(){
	var r=M.classList.toggle('hide');
	sC.innerHTML=r?'&laquo;':'&raquo;';
};
eS.onclick=eSave;
eSC.onclick=function(){eSave();eClose();};
E.close=$('#eClose').onclick=function(){if(confirmCancel(!eS.disabled)) eClose();};
initEditor(function(o){T=o;},{save:eSave,exit:E.close,onchange:E.markDirty});

// Load at last
bg.getData(function(o){
	L.innerHTML='';cache=o;
	bg.ids.forEach(function(i){addItem(bg.metas[i]);});
});
function updateItem(r){
	if(!r.id) return;
	var m=bg.metas[r.id];
	switch(r.status){
		case 0:loadItem(m,r);break;
		case 1:addItem(m);break;
		default:modifyItem(r);
	}
}
bg._updateItem.push(updateItem);

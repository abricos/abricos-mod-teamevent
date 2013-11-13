/* 
@package Abricos
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: '{C#MODNAME}', files: ['lib.js']}
	]
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		L = YAHOO.lang;

	var BW = Brick.mod.widget.Widget;
	var buildTemplate = this.buildTemplate;
	
	var EventListRowWidget = function(container, event, cfg){
		cfg = L.merge({
			'desctrim': 300,
			'override': null
		}, cfg || {});
		
		EventListRowWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 'tnames': 'row,img',
			'isRowWidget': true,
			'override': cfg['override']
		}, event, cfg);
	};
	YAHOO.extend(EventListRowWidget, BW, {
		init: function(event, cfg){
			this.event = event;
			this.cfg = cfg;
		},
		buildTData: function(event, cfg){
			return {
				'id': event.id,
				'tl': event.title,
				'dsc': '',
				'urlview': event.navigator.eventView(),
				'img': !L.isValue(event.logo) ? '' : this._TM.replace('img', {
					'urlview': event.navigator.eventView(),
					'fid': event.logo,
					'tl': event.title
				})
			};
		},
		trimDescript: function(s){
			var cfg = this.cfg;
			s = s.replace(/\<br\/\>/gi, ' ');
			if (cfg['desctrim'] > 0 && s.length > cfg['desctrim']){
				s = s.substring(0, cfg['desctrim']) +"...";
			}
			return s;
		}
	});

	NS.EventListRowWidget = EventListRowWidget;
	
	var EventListWidget = function(container, list, cfg){
		cfg = L.merge({
			'override': null
		}, cfg || {});
		
		EventListWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 'tnames': 'list,empty',
			'override': cfg['override']
		}, list, cfg);
	};
	EventListWidget.overrides = {};
	
	YAHOO.extend(EventListWidget, BW, {
		init: function(list, cfg){
			this.list = list;
			this.cfg = cfg;
			this._wList = [];
		},
		destroy: function(){
			this._clearWS();
			EventListWidget.superclass.destroy.call(this);
		},
		_clearWS: function(){
			var ws = this._wList;
			for (var i=0;i<ws.length;i++){
				ws[i].destroy();
			}
			this._wList = [];
		},
		onClick: function(el, tp){
			return false;
		},
		render: function(){
			this._clearWS();
			
			if (!L.isValue(this.list)){
				return;
			}
			
			var __self = this, ws = this._wList;
			
			this.list.foreach(function(event){
				var wRowClass = NS.EventListWidget.overrides[event.module];
				if (wRowClass){
					ws[ws.length] = new wRowClass(__self.gel('list'), event);
				}else{
					ws[ws.length] = new NS.EventListRowWidget(__self.gel('list'), event);
				}
			});
			for (var i=0;i<ws.length;i++){
				ws[i].render();
			}
		}		
	});
	NS.EventListWidget = EventListWidget;
	
	var TeamEventListWidget = function(container, teamid, cfg){
		cfg = L.merge({
			'modName': null,
			'override': null
		}, cfg || {});

		TeamEventListWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 'tnames': 'team',
			'override': cfg['override']
		}, teamid, cfg);
	};
	YAHOO.extend(TeamEventListWidget, BW, {
		init: function(teamid, cfg){
			this.teamid = teamid;
			this.team = null;
			this.cfg = cfg;
			
			this.eventManager = null;
			this._editor = null;
			this.listWidget = null;
		},
		onLoad: function(teamid, cfg){
			var __self = this;
			NS.EventManager.init(cfg['modName'], function(man){
				if (!L.isValue(man)){ return; }
				
				__self.eventManager = man;
				__self.reloadList();
			});
		},
		reloadList: function(){
			this.elShow('loading');
			this.elHide('rlwrap,badd');
			
			var __self = this;
			this.eventManager.eventListLoad(this.teamid, function(list, team){
				if (!L.isValue(team)){
					__self.onLoadList(null);
				}else{
					__self.team = team;
					__self.onLoadList(list);
				}
			});
		},
		onClick: function(el, tp){
			switch(el.id){
			case tp['badd']: this.showEventEditor(); return true;
			}
			return false;
		},
		onLoadList: function(list){
			this.list = list;

			this.elHide('loading');
			this.elShow('rlwrap');
			
			if (!L.isValue(this.team)){
				return;
			}
			if (this.team.role.isAdmin){
				this.elShow('badd');
			}
			
			if (L.isValue(this.listWidget)){
				this.listWidget.destroy();
			}
			
			this.listWidget = new NS.EventListWidget(this.gel('list'), this.list); 
		},
		closeEditors: function(){
			if (L.isNull(this._editor)){ return; }
			this._editor.destroy();
			this._editor = null;
			this.elShow('btns,list');
		},
		showEventEditor: function(){
			this.closeEditors();

			var __self = this, cfg = this.cfg, mcfg = this.eventManager.cfg['eventEditor'];

			this.componentLoad(mcfg['module'], mcfg['component'], function(){
				__self.elHide('btns,list');

				__self._editor = new Brick.mod[mcfg['module']][mcfg['widget']](__self.gel('editor'), __self.teamid, 0, {
					'modName': cfg['modName'],
					'callback': function(act){
						__self.closeEditors();
						
						if (act == 'save'){ 
							__self.reloadList();
						}
					}
				});
			}, {'hide': 'bbtns', 'show': 'edloading'});
		}
	});
	
	NS.TeamEventListWidget = TeamEventListWidget;

};
/* 
@package Abricos
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: 'team', files: ['lib.js']}
	]
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		L = YAHOO.lang,
		R = NS.roles;

	var SysNS = Brick.mod.sys,
		NSTM = Brick.mod.team;

	this.buildTemplate({}, '');
	
	NS.lif = function(f){return L.isFunction(f) ? f : function(){}; };
	NS.life = function(f,p1,p2,p3,p4,p5,p6,p7){
		f=NS.lif(f); f(p1,p2,p3,p4,p5,p6,p7);
	};
	NS.Item = SysNS.Item;
	NS.ItemList = SysNS.ItemList;

	var _ETMODULENAMECACHE = {};

	var Event = function(d){
		d = L.merge({
			'm': '',
			'tid': 0,
			'fdt': 0,
			'fdtt': 0,
			'tl': '',
			'logo': ''
		}, d || {});
		
		this.manager = NSTM.app.get(d['m'], 'event');
		
		Event.superclass.constructor.call(this, d);
	};
	YAHOO.extend(Event, SysNS.Item, {
		init: function(d){
			this.taData = null;
			this.detail = null;
			
			Event.superclass.init.call(this, d);
		},		
		update: function(d){
			this.module		= d['m'];
			this.teamid		= d['tid']|0;
			this.title		= d['tl'];
			this.logo		= d['logo'];
			this.fromDate	= d['fdt']|0;
			this.fromDateTime = (d['fdtt']|0) > 0;
			
			if (this.id > 0){
				_ETMODULENAMECACHE[this.id|0] = this.module;
			}
			
			if (L.isValue(d['dtl'])){
				this.detail = new this.manager.EventDetailClass(d['dtl']);
			}
		},
		
		setTeamAppData: function(taData){
			this.taData = taData;
		}
	});
	NS.Event = Event;
	
	var EventDetail = function(d){
		d = L.merge({
			// 'dsc': ''
		}, d || {});
		this.init(d);
	};
	EventDetail.prototype = {
		init: function(d){
			this.update(d);
		},
		update: function(d){
			// this.address = d['adr'];
		}
	};
	NS.EventDetail = EventDetail;
	
	var EventList = function(d){
		EventList.superclass.constructor.call(this, d, Event);
	};
	YAHOO.extend(EventList, SysNS.ItemList, {});
	NS.EventList = EventList;
	
	var InitData = function(manager, d){
		d = L.merge({
		}, d || {});
		InitData.superclass.constructor.call(this, manager, d);
	};
	YAHOO.extend(InitData, NSTM.TeamAppInitData, {
		update: function(d){
		}
	});
	NS.InitData = InitData;
	
	// Данные сообщества
	var TeamExtendedData = function(team, manager, d){
		d = L.merge({
		}, d || {});
		TeamExtendedData.superclass.constructor.call(this, team, manager, d);
	};
	YAHOO.extend(TeamExtendedData, NSTM.TeamExtendedData, {
		init: function(team, manager, d){
			
			TeamExtendedData.superclass.init.call(this, team, manager, d);
		},
		update: function(d){
			TeamExtendedData.superclass.update.call(this, d);
		}
	});
	NS.TeamExtendedData = TeamExtendedData;
		
	var Navigator = function(taData){
		Navigator.superclass.constructor.call(this, taData);
	};
	YAHOO.extend(Navigator, NSTM.TeamAppNavigator, {
		eventList: function(){
			return this.URI()+'eventlist/TeamEventListWidget/';
		},
		eventView: function(eventid){
			return this.URI()+'eventview/TeamEventViewWidget/'+eventid+'/';
		}
	});
	NS.Navigator = Navigator;
	
	var EventManager = function(modName, callback, cfg){
		this.modName = modName;
		
		cfg = L.merge({
			'TeamExtendedDataClass':TeamExtendedData,
			'EventClass':			Event,
			'EventDetailClass':		EventDetail,
			'EventListClass':		EventList,
			'NavigatorClass':		Navigator,
			'InitDataClass':		InitData
		}, cfg || {});
		
		// специализированный виджеты в перегруженном модуле
		cfg['eventEditor'] = L.merge({
			'module': 'teamevent',
			'component': 'eventeditor',
			'widget': 'EventEditorWidget'
		}, cfg['eventEditor'] || {});

		EventManager.superclass.constructor.call(this, modName, 'event', callback, cfg);
	};
	YAHOO.extend(EventManager, NSTM.TeamAppManager, {
		init: function(callback, cfg){
			EventManager.superclass.init.call(this, callback, cfg);
			
			this.EventClass			= cfg['EventClass'];
			this.EventDetailClass	= cfg['EventDetailClass'];
			this.EventListClass		= cfg['EventListClass'];
			
			this._cacheEvent = {};
			
			NS.life(callback, this);
		},
		
		_updateEvent: function(team, d){
			if (!(L.isValue(d) && L.isValue(d['event']))){
				return null;
			}
			var event = new this.EventClass(d['event']);
			event.setTeam(team);
			return event;
		},
		
		eventLoad: function(eventid, callback, cfg){
			cfg = L.merge({
				'reload': false
			}, cfg || {});
			
			var __self = this,
				event = this._cacheEvent[eventid];
			
			if (L.isValue(event) && L.isValue(event.detail) && !cfg['reload']){
				NS.life(callback, event, event.team);
				return;
			}			
			
			this.ajax({
				'do': 'event',
				'eventid': eventid
			}, function(d){
				
				if (!L.isValue(d) || !L.isValue(d['event'])){
					NS.life(callback, null, null);
					return;
				}
				Brick.mod.team.teamLoad(d['event']['tid'], function(team){
					var event = null;
					if (L.isValue(team)){
						event = __self._updateEvent(team, d);
						__self._cacheEvent[eventid] = event;
					}
					NS.life(callback, event, team);
				});
			});			
		},
		
		_updateEventList: function(taData, d){

			if (!L.isValue(d) || !L.isValue(d['events']) || !L.isArray(d['events']['list'])){
				return null;
			}
			var list = new this.EventListClass();
			
			var dList = d['events']['list'];
			for (var i=0; i<dList.length; i++){
				var event = new this.EventClass(dList[i]);
				event.setTeamAppData(taData);
				list.add(event);
			}

			return list;
		},
		
		eventListLoad: function(taData, callback){
			var __self = this;
			this.ajax({
				'do': 'eventlist',
				'teamid': taData.team.id
			}, function(d){
				var list = __self._updateEventList(taData, d);
				NS.life(callback, list);
			});
		},
		
		eventSave: function(teamid, sd, callback){
			var __self = this;
			this.ajax({
				'do': 'eventsave',
				'teamid': teamid,
				'savedata': sd
			}, function(d){
				var event = __self._updateEvent(d);
				NS.life(callback, event);
			});
		},

		eventRemove: function(team, eventid, callback){
			this.ajax({
				'do': 'eventremove',
				'teamid': team.id,
				'eventid': eventid
			}, function(d){
				NS.life(callback);
			});
		}
	});
	NS.EventManager = EventManager;

	/*
	EventManager.get = function(modName){
		var man = Brick.mod[modName]['eventManager'];
		if (!L.isObject(man)){
			man = null;
		}
		return man;
	};
	/**/
	
	EventManager.init = function(modName, callback){
		Brick.mod.team.app.load(modName, "event", function(man){
			NS.life(callback, man);
		});
	};
	
	NS.getEvent = function(eventid, callback, cfg){
		cfg = L.merge({
			'modName': null
		}, cfg || {});
		
		var eventLoad = function(mName){

			Brick.mod.team.app.load(mName, "event", function(man){
				man.eventLoad(eventid, function(event, team){
					NS.life(callback, event, team);
				});
			});
		};
		
		if (L.isString(cfg['modName']) && cfg['modName'].length > 0){
			eventLoad(cfg['modName']);
		}else if (L.isValue(_EMODULENAMECACHE[eventid])){
			eventLoad(_ETMODULENAMECACHE[eventid]);
		}else{
			Brick.ajax('teamevent', {
				'data': {
					'do': 'eventmodulename',
					'eventid': eventid
				},
				'event': function(request){
					if (L.isValue(request) && L.isValue(request.data)){
						var mName = request.data;
						eventLoad(mName);
					}else{
						NS.life(callback, null);
					}
				}
			});		
		}
	};
	
};
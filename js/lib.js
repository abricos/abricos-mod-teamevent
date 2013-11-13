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

	var SysNS = Brick.mod.sys;

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
		
		this.manager = EventManager.get(d['m']);
		
		Event.superclass.constructor.call(this, d);
	};
	YAHOO.extend(Event, SysNS.Item, {
		init: function(d){
			this.team = null;
			this.navigator = null;
			this.detail = null;
			
			this.manager = EventManager.get(d['m']);
			
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
		setTeam: function(team){
			this.team = team;
			this.navigator = new this.manager['NavigatorClass'](this);
			
			/*
			if (this.id>0 && (!L.isString(this.logo) || this.logo.length == 0)){
				this.logo = team.logo;
			}
			/**/
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
	
	var Navigator = function(event){
		this.init(event);
	};
	Navigator.prototype = {
		init: function(event){
			this.event = event;
		},
		URI: function(){
			return this.event.team.navigator.URI()+this.event.module+'/';
		},
		eventList: function(){
			return this.URI()+'eventlist/TeamEventListWidget/';
		},
		eventView: function(){
			return this.URI()+'eventview/TeamEventViewWidget/'+this.event.id+'/';
		}
	};
	NS.Navigator = Navigator;
	
	
	var EventManager = function(modName, callback, cfg){
		this.modName = modName;
		
		cfg = L.merge({
			'EventClass':			Event,
			'EventDetailClass':		EventDetail,
			'EventListClass':		EventList,
			'NavigatorClass':		Navigator
		}, cfg || {});
		
		// специализированный виджеты в перегруженном модуле
		cfg['eventEditor'] = L.merge({
			'module': 'teamevent',
			'component': 'eventeditor',
			'widget': 'EventEditorWidget'
		}, cfg['eventEditor'] || {});

		
		this.init(callback, cfg);
	};
	EventManager.prototype = {
		init: function(callback, cfg){
			this.cfg = cfg;
			
			this.EventClass			= cfg['EventClass'];
			this.EventDetailClass	= cfg['EventDetailClass'];
			this.EventListClass		= cfg['EventListClass'];
			this.NavigatorClass		= cfg['NavigatorClass'];
			
			this._loadInitData = true;
			this._cacheEvent = {};
			
			NS.life(callback, this);
		},
		
		ajax: function(d, callback){
			d = d || {};
			d['tm'] = Math.round((new Date().getTime())/1000);
			if (this._loadInitData){
				d['initdata'] = true;
			}
			var __self = this;
			Brick.ajax(this.modName, {
				'data': d,
				'event': function(request){
					var d = L.isValue(request) && L.isValue(request.data) ? request.data : null,
						result = L.isValue(d) ? (d.result ? d.result : null) : null;
						
					if (L.isValue(d) && L.isValue(d['initdata'])){
						__self._loadInitData = false;
						__self.onLoadInitData(d['initdata']);
					}
					
					NS.life(callback, result);
				}
			});
		},
		
		onLoadInitData: function(d){ },
		
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
		
		_updateEventList: function(team, d){
			if (!L.isValue(d) || !L.isValue(d['events']) || !L.isArray(d['events']['list'])){
				return null;
			}
			var list = new this.EventListClass();
			
			var dList = d['events']['list'];
			for (var i=0; i<dList.length; i++){
				var event = new this.EventClass(dList[i]);
				event.setTeam(team);
				list.add(event);
			}
			return list;
		},
		
		eventListLoad: function(teamid, callback){
			var __self = this;
		
			Brick.mod.team.teamLoad(teamid, function(team){
				if (!L.isValue(team)){
					NS.life(callback, null, null);
				}else{
					__self.ajax({
						'do': 'eventlist',
						'teamid': teamid
					}, function(d){
						var list = __self._updateEventList(team, d);
						NS.life(callback, list, team);
					});
				}
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
		
	};
	NS.EventManager = EventManager;
	
	EventManager.get = function(modName){
		var man = Brick.mod[modName]['eventManager'];
		if (!L.isObject(man)){
			man = null;
		}
		return man;
	};
	
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
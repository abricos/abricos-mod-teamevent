/*
@package Abricos
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
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

	var buildTemplate = this.buildTemplate;
	var isem = function(s){ return L.isString(s) && s.length > 0; };

	var TeamEventViewWidget = function(container, teamid, eventid, cfg){
		cfg = L.merge({
			'modName': null,
			'override': null
		}, cfg || {});
		
		TeamEventViewWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 'tnames': 'widget', 
			'override': cfg['override']
		}, teamid, eventid, cfg);
	};
	YAHOO.extend(TeamEventViewWidget, Brick.mod.widget.Widget, {
		init: function(teamid, eventid, cfg){
			this.teamid = teamid;
			this.eventid = eventid;
			this.cfg = cfg;
			this.event = null;

			this._editor = null;
		},
		onLoad: function(teamid, eventid, cfg){
			var __self = this;
			Brick.mod.team.teamAppDataLoad(teamid, cfg['modName'], 'event', function(taData){
				if (!L.isValue(taData)){
					__self.onLoadEvent(null);
					return;
				}
				taData.manager.eventLoad(taData, eventid, function(event){
					__self.onLoadEvent(event);
				});
			});
		},
		onLoadEvent: function(event){
			this.event = event;
			
			this.elHide('loading');
			this.render();
		},
		render: function(){
			this.elHide('loading,nullitem,rlwrap');
			this.elHide('fldsite,flddescript,fldemail');
			
			if (!L.isValue(this.event)){
				this.elShow('nullitem');
				return;
			}
			this.elShow('rlwrap');
			
			var event = this.event, team = event.taData.team;
			
			var sFDate = '', sFTDate = '';
			if (event.fromDate > 0){
				sFDate = Brick.dateExt.convert(event.fromDate, 3, true);
				if (event.fromDateTime){
					sFTDate = Brick.dateExt.convert(event.fromDate, 4, true);
				}
			}
			this.elSetHTML({
				'fromdate': sFDate,
				'fromdatetime': sFTDate,
				'title': event.title,
				'descript': event.descript
			});
			
			if (team.role.isAdmin){
				this.elShow('btns');
				var mcfg = event.taData.manager.cfg['eventEditor'];
				this.componentLoad(mcfg['module'], mcfg['component'], function(){
				}, {'hide': 'bbtns', 'show': 'edloading'});
			}
		},
		onClick: function(el, tp){
			switch(el.id){
			case tp['bedit']: this.showEventEditor(); return true;
			case tp['bremove']: this.showRemovePanel(); return true;
			}
			return false;
		},
		closeEditors: function(){
			if (L.isNull(this._editor)){ return; }
			this._editor.destroy();
			this._editor = null;
			this.elShow('btns,view');
		},
		showEventEditor: function(){
			this.closeEditors();

			var __self = this, cfg = this.cfg,
				event = this.event,
				taData = event.taData,
				mcfg = taData.manager.cfg['eventEditor'];

			this.elHide('btns,view');

			this._editor = new Brick.mod[mcfg['module']][mcfg['widget']](this.gel('editor'), taData.team.id, event.id, {
				'modName': cfg['modName'],
				'callback': function(act){
					__self.closeEditors();
			
					if (act == 'save'){ 
						__self.render();
						Brick.Page.reload();
					}
				}
			});
		},
		showRemovePanel: function(){
			/*
			var __self = this, team = this.team, mcfg = team.manager.cfg['teamRemove'];

			this.componentLoad(mcfg['module'], mcfg['component'], function(){
				__self._editor = new Brick.mod[mcfg['module']][mcfg['panel']](team, function(){
					Brick.Page.reload("#app="+team.module+"/wspace/ws");
				});
			}, {'hide': 'bbtns', 'show': 'edloading'});
			/**/
		}
	});
	NS.TeamEventViewWidget = TeamEventViewWidget;
	
};
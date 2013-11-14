/*
@package Abricos
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = {
	mod:[
		{name: 'widget', files: ['calendar.js']},
		{name: 'team', files: ['editor.js', 'lib.js']},
		{name: '{C#MODNAME}', files: ['lib.js']}
	]
};
Component.entryPoint = function(NS){
	
	var Dom = YAHOO.util.Dom,
		L = YAHOO.lang;

	var buildTemplate = this.buildTemplate;
	
	var EventEditorWidget = function(container, teamid, eventid, cfg){
		eventid = eventid|0;
		
		cfg = L.merge({
			'modName': null,
			'callback': null,
			'override': null
		}, cfg || {});
		EventEditorWidget.superclass.constructor.call(this, container, {
			'buildTemplate': buildTemplate, 'tnames': 'widget',
			'override': cfg['override']
		}, teamid, eventid, cfg);
	};
	YAHOO.extend(EventEditorWidget, Brick.mod.widget.Widget, {
		init: function(teamid, eventid, cfg){
			this.teamid = teamid;
			this.eventid = eventid;
			this.cfg = cfg;
			this.taData = null;
		},
		buildTData: function(teamid, eventid, cfg){
			return {'cledst': eventid==0?'edstnew': 'edstedit'};
		},
		onLoad: function(teamid, eventid, cfg){
			var __self = this;
			
			Brick.mod.team.teamAppDataLoad(teamid, cfg['modName'], 'event', function(taData){
				if (!L.isValue(taData)){
					__self.onLoadEvent(null);
					return;
				}					
				if (eventid == 0){
					var event = new man.EventClass({
						'tid': teamid,
						'm': cfg['modName'],
						'dtl': {}
					});
					event.setTeamAppData(taData);
					__self.onLoadEvent(event);
				}else{
					taData.manager.eventLoad(taData, eventid, function(event){
						__self.onLoadEvent(event);
					});
				}
			});
		},
		onClick: function(el, tp){
			switch(el.id){
			case tp['bcreate']:
			case tp['bsave']: this.save(); return true;
			case tp['bcancel']: this.cancel(); return true;
			}
			return false;
		},
		onLoadEvent: function(event){
			this.event = event;
			this.render();
		},
		render: function(){
			var event = this.event;
			if (!L.isValue(event)){ return; }

			if (!L.isValue(this.logoWidget)){
				this.logoWidget = new Brick.mod.team.LogoWidget(this.gel('logo'), event.logo);
				
				this.fromDateWidget = new Brick.mod.widget.DateInputWidget(this.gel('fdt'), {
					'date': event.fromDate == 0 ? new Date() : new Date(event.fromDate*1000),
					'showBClear': true,
					'showTime': event.fromDateTime,
					'showBTime': true
				});
				
			}
			
			this.elHide('loading');
			this.elShow('editor');
			
			this.elSetValue({
				'title': event.title
			});
		},
		cancel: function(){
			NS.life(this.cfg['callback'], 'cancel');
		},
		getSaveData: function(){
			var fdtWidget = this.fromDateWidget,
				fdt = fdtWidget.getValue();
			
			return {
				'id': this.event.id,
				'tl': this.gel('title').value,
				'dsc': this.gel('descript').value,
				'logo': this.logoWidget.getValue(),
				'fdt': L.isNull(fdt) ? 0 : fdt.getTime()/1000,
				'fdtt': fdtWidget.getTimeVisible() ? 1 : 0
			};
		},
		save: function(){
			var __self = this;
			var sd = this.getSaveData(), taData = this.event.taData;
			
			this.elHide('btns');
			this.elShow('bloading');
			
			taData.manager.eventSave(taData, sd, function(event){
				__self.elShow('btns');
				__self.elHide('bloading');
				NS.life(__self.cfg['callback'], 'save', event);
			});
		}		
	});
	NS.EventEditorWidget = EventEditorWidget;
	
	
	var EventRemovePanel = function(event, callback){
		this.event = event;
		this.callback = callback;
		EventRemovePanel.superclass.constructor.call(this, {fixedcenter: true});
	};
	YAHOO.extend(EventRemovePanel, Brick.widget.Dialog, {
		initTemplate: function(){
			return buildTemplate(this, 'removepanel').replace('removepanel');
		},
		onClick: function(el){
			var tp = this._TId['removepanel'];
			switch(el.id){
			case tp['bcancel']: this.close(); return true;
			case tp['bremove']: this.remove(); return true;
			}
			return false;
		},
		remove: function(){
			var TM = this._TM, gel = function(n){ return  TM.getEl('removepanel.'+n); },
				__self = this;
			Dom.setStyle(gel('btns'), 'display', 'none');
			Dom.setStyle(gel('bloading'), 'display', '');
			this.event.manager.eventRemove(this.event, function(){
				__self.close();
				NS.life(__self.callback);
			});
		}
	});
	NS.EventRemovePanel = EventRemovePanel;

};
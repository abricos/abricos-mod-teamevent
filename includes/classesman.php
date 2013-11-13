<?php 
/**
 * @package Abricos
 * @subpackage TeamEvent
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

require_once 'dbquery.php';

class TeamEventManager extends TeamAppManager {
	
	/**
	 * @var TeamEvent
	 */
	public $EventClass			= TeamEvent;
	public $EventDetailClass	= TeamEventDetail;
	public $EventListClass		= TeamEventList;
	
	public $fldExtEvent			= array();
	public $fldExtEventDetail	= array();
	
	/**
	 * @param Ab_ModuleManager $modManager
	 */
	public function __construct(Ab_ModuleManager $mman, $appName = ''){
		parent::__construct($mman, $appName);
		
		$this->TeamAppNavigatorClass = TeamEventNavigator;
	}
	
	public function IsAdminRole(){ return $this->modManager->IsAdminRole(); }
	public function IsWriteRole(){ return $this->modManager->IsWriteRole(); }
	public function IsViewRole(){ return $this->modManager->IsViewRole(); }
	
	/**
	 * @param array $d
	 * @return TeamEvent
	 */
	public function NewEvent($d){ 
		return new $this->EventClass($d);
	}
	
	/**
	 * @param Team $team
	 * @return TeamDetail
	 */
	public function NewEventDetail(TeamEvent $event, $d){
		return new $this->EventDetailClass($event, $d);
	}

	/**
	 * @return TeamEventList
	 */
	public function NewEventList(){ return new $this->EventListClass(); }
	
	public function AJAXMethod($d){
		switch($d->do){
			case "event": return $this->EventToAJAX($d->eventid);
			case "eventlist": return $this->EventListToAJAX($d->teamid);
			case "eventsave": return $this->EventSaveToAJAX($d->teamid, $d->savedata);
			case "eventremove": return $this->EventRemove($d->teamid, $d->eventid);
		}
		return null;
	}
	
	public function InitDataToAJAX(){
		$ret = new stdClass();
		$ret->initdata = new stdClass();
		return $ret;
	}
	
	/**
	 * Мероприятие сообещства
	 * 
	 * @param integer $eventid
	 * @param boolean $clearCache
	 * @return TeamEvent
	 */
	public function Event($eventid, $clearCache = false){
		if (!$this->IsViewRole()){ return null; }
		
		$cacheName = "event";
		
		if ($clearCache){
			$this->CacheClear($cacheName, $eventid);
		}
		$event = $this->Cache($cacheName, $eventid);
		if (!empty($event)){ return $event; }
		
		$dbEvent = TeamEventQuery::Event($this, $eventid);
		if (empty($dbEvent)){ return null; }
		
		$teamid = $dbEvent['tid'];
		
		$team = $this->Team($teamid);
		if (empty($team)){ return null; }
		
		$event = $this->NewEvent($dbEvent);
		
		$event->detail = $this->NewEventDetail($event, $dbEvent);
		
		$this->CacheAdd($cacheName, $eventid, $event);
	
		return $event;
	}
	
	public function EventToAJAX($eventid){
		$event = $this->Event($eventid);
		if (empty($event)){ return null; }
	
		$ret = new stdClass();
		$ret->event = $event->ToAJAX();
	
		return $ret;
	}

	/**
	 * Список мероприятий сообещства
	 * @param integer $teamid
	 * @return TeamEventList
	 */
	public function EventList($teamid){
		if (!$this->IsViewRole()){ return null; }
		
		$team = $this->Team($teamid);
		if (empty($team)){ return null; }
	
		$list = $this->NewEventList();
		$rows = TeamEventQuery::EventList($this, $teamid);
	
		while (($d = $this->db->fetch_array($rows))){
			$list->Add($this->NewEvent($d));
		}
	
		return $list;
	}
	
	public function EventListToAJAX($teamid){
		$list = $this->EventList($teamid);
		if (empty($list)){ return null; }
	
		$ret = new stdClass();
		$ret->events = $list->ToAJAX();
	
		return $ret;
	}
	
	public function EventSave($teamid, $d){
		$team = $this->Team($teamid);
	
		if (empty($team) || !$team->role->IsAdmin()){ // текущий пользователь не админ => нет прав
			return null;
		}
		$eventid = intval($d->id);
		
		$utmf = Abricos::TextParser(true);
		$d->tl = $utmf->Parser($d->tl);
		$d->dsc = $utmf->Parser($d->dsc);
		
		if ($eventid == 0){
			$eventid = TeamEventQuery::EventAppend($this->db, $this->moduleName, $teamid, $d);
		}else{
			$event = $this->Event($teamid, $eventid);
			if (empty($event)){ return null; }
			TeamEventQuery::EventUpdate($this->db, $this->moduleName, $teamid, $eventid, $d);
		}
		$this->CacheClear();
		
		return $eventid;
	}
	
	public function EventSaveToAJAX($teamid, $d){
		$eventid = $this->EventSave($teamid, $d);
		if (empty($eventid)){ return null; }
		
		$ret = $this->EventList($teamid);
		
		$obj = $this->EventToAJAX($teamid, $eventid);
		$ret->eventid = $eventid;
		$ret->event = $obj->event;
		
		return $ret;
	}
	
	public function EventRemove($teamid, $eventid){
		$team = $this->Team($teamid);
	
		if (!$team->role->IsAdmin()){ // текущий пользователь не админ => нет прав
			return null;
		}
	
		TeamEventQuery::EventRemove($this->db, $teamid, $eventid);
		return true;
	}	
}


?>
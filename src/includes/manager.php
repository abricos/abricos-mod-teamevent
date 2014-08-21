<?php
/**
 * @package Abricos
 * @subpackage TeamEvent
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

require_once 'classes.php';
require_once 'dbquery.php';

class TeamEventModuleManager extends Ab_ModuleManager {
	
	/**
	 * @var TeamEventModule
	 */
	public $module = null;
	
	/**
	 * @var TeamEventModuleManager
	 */
	public static $instance = null; 
	
	public function __construct(TeamEventModule $module){
		parent::__construct($module);
		
		TeamEventModuleManager::$instance = $this;
	}
	
	public function IsAdminRole(){
		return $this->IsRoleEnable(TeamEventAction::ADMIN);
	}
	
	public function IsWriteRole(){
		if ($this->IsAdminRole()){ return true; }
		return $this->IsRoleEnable(TeamEventAction::WRITE);
	}
	
	public function IsViewRole(){
		if ($this->IsWriteRole()){ return true; }
		return $this->IsRoleEnable(TeamEventAction::VIEW);
	}
	
	public function AJAX($d){
		switch($d->do){
			case 'eventmodulename': return $this->EventModuleName($d->teamid, $d->eventid);
		}
		return null;
	}
	
	public function EventModuleName($eventid){
		if (!$this->IsViewRole()){ return null; }
	
		return TeamEventQuery::EventModuleName($this->db, $eventid);
	}
	

}

?>
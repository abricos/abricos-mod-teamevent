<?php 
/**
 * @package Abricos
 * @subpackage TeamEvent
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/**
 * События - абстрактное приложение для сообществ
 */
class TeamEventModule extends Ab_Module {

	public function __construct(){
		$this->version = "0.1";
		$this->name = "teamevent";
		$this->permission = new TeamEventPermission($this);
	}
	
	/**
	 * Получить менеджер
	 *
	 * @return TeamEventModuleManager
	 */
	public function GetManager(){
		if (is_null($this->_manager)){
			require_once 'includes/manager.php';
			$this->_manager = new TeamEventModuleManager($this);
		}
		return $this->_manager;
	}
}

class TeamEventAction {
	const VIEW	= 10;
	
	const WRITE	= 30;
	
	const ADMIN	= 50;
}

class TeamEventPermission extends Ab_UserPermission {
	
	public function TeamEventPermission(TeamEventModule $module){
		
		$defRoles = array(
			new Ab_UserRole(TeamEventAction::VIEW, Ab_UserGroup::GUEST),
			new Ab_UserRole(TeamEventAction::VIEW, Ab_UserGroup::REGISTERED),
			new Ab_UserRole(TeamEventAction::VIEW, Ab_UserGroup::ADMIN),
			
			new Ab_UserRole(TeamEventAction::WRITE, Ab_UserGroup::REGISTERED),
			new Ab_UserRole(TeamEventAction::WRITE, Ab_UserGroup::ADMIN),
			
			new Ab_UserRole(TeamEventAction::ADMIN, Ab_UserGroup::ADMIN),
		);
		parent::__construct($module, $defRoles);
	}
	
	public function GetRoles(){
		return array(
			TeamEventAction::VIEW => $this->CheckAction(TeamEventAction::VIEW),
			TeamEventAction::WRITE => $this->CheckAction(TeamEventAction::WRITE),
			TeamEventAction::ADMIN => $this->CheckAction(TeamEventAction::ADMIN)
		);
	}
}

Abricos::ModuleRegister(new TeamEventModule());

?>
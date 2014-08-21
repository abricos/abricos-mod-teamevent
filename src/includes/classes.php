<?php 
/**
 * @package Abricos
 * @subpackage TeamEvent
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

require_once 'modules/team/includes/classes.php';
require_once 'modules/team/includes/classesapp.php';
require_once 'classesman.php';

class TeamEventNavigator extends TeamAppNavigator { }

/**
 * Событие сообщества (встречи, сборы и т.п.)
 */
class TeamEvent extends AbricosItem {

	public $teamid;
	
	public $module;
	
	/**
	 * Название
	 * @var string
	 */
	public $title;
	
	/**
	 * Дата начала события
	 * @var integer
	 */
	public $fromDate;
	
	/**
	 * Уточнить время начала события
	 * @var boolean
	 */
	public $fromDateTime;
	
	/**
	 * Краткое описание мероприятия
	 * @var string
	 */
	public $descript;
	
	/**
	 * @var TeamEventDetail
	 */
	public $detail = null;
	
	public function __construct($d){
		parent::__construct($d);
		
		$this->teamid = intval($d['tid']);
		$this->module = strval($d['m']);
		$this->title = strval($d['tl']);
		$this->descript = strval($d['dsc']);
		$this->fromDate = intval($d['fdt']);
		$this->fromDateTime = $d['fdtt']>0;
	}
	
	public function ToAJAX(){
		$ret = parent::ToAJAX();
		$ret->tid	= $this->teamid;
		$ret->m		= $this->module;
		$ret->tl	= $this->title;
		$ret->dsc	= $this->descript;
		$ret->fdt	= $this->fromDate;
		$ret->fdtt	= $this->fromDateTime ? 1 : 0;
		
		if (!empty($this->detail)){
			$ret->dtl = $this->detail->ToAJAX();
		}
		
		return $ret;
	}
}

/**
 * Детальная информация события
 */
class TeamEventDetail {

	public $event;

	public function __construct(TeamEvent $event, $d){
		$this->event = $event;
	}

	public function ToAJAX(){
		$ret = new stdClass();

		return $ret;
	}
}


class TeamEventList extends AbricosList { }


?>
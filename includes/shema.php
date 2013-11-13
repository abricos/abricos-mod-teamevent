<?php
/**
 * Схема таблиц данного модуля.
 * 
 * @package Abricos
 * @subpackage TeamEvent
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author  Alexander Kuzmin <roosit@abricos.org>
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = Ab_UpdateManager::$current; 
$db = Abricos::$db;
$pfx = $db->prefix;

if ($updateManager->isInstall()){
	Abricos::GetModule('teamevent')->permission->Install();
	
	$db->query_write("
		CREATE TABLE IF NOT EXISTS `".$pfx."teamevent` (
			`eventid` integer(10) unsigned NOT NULL auto_increment COMMENT 'Идентификатор события',
			`teamid` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Сообщество',
			`module` varchar(25) NOT NULL DEFAULT '' COMMENT 'Модуль создатель',
			
			`userid` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Создатель мероприятия',
			
			`title` varchar(250) NOT NULL DEFAULT '' COMMENT 'Заголовок',
			`descript` TEXT NOT NULL  COMMENT 'Краткое описание',
			`logo` varchar(8) NOT NULL DEFAULT '' COMMENT '',
			
			`datefrom` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Начало события',
			`datefromtime` tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT 'Уточнить время',
			
			`dateto` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Окончание события',
			`datetotime` tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT 'Уточнить время',
			
			`dateline` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата создания',
			`deldate` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата удаления',
	
			PRIMARY KEY (`eventid`),
			KEY `teamevent` (`teamid`, `module`, `deldate`),
			KEY `datefrom` (`datefrom`)
		)". $charset
	);
	
}

if ($updateManager->isUpdate('0.1.1') && !$updateManager->isInstall()){
	$db->query_write("RENAME TABLE `".$pfx."team_event` TO `".$pfx."teamevent`");
	
	$db->query_write("
		ALTER TABLE `".$pfx."teamevent`
		ADD `module` varchar(25) NOT NULL DEFAULT '' COMMENT 'Модуль создатель',
		DROP `address`,
		DROP INDEX `deldate`,
		ADD INDEX `teamevent` (`teamid`, `module`, `deldate`),
		ADD INDEX `datefrom` (`datefrom`)
	");
	
}

?>
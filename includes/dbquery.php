<?php
/**
 * @package Abricos
 * @subpackage Team
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

class TeamEventQuery {
	
	public static function EventModuleName(Ab_Database $db, $eventid){
		$sql = "
			SELECT e.module as m
			FROM ".$db->prefix."teamevent e
			WHERE e.deldate=0 AND e.eventid=".bkint($eventid)."
			LIMIT 1
		";
		$row = $db->query_first($sql);
		if (empty($row)){ return null; }
	
		return $row['m'];
	}
	
	public static $EVENTFIELD = "
		e.eventid as id,
		e.module as m,
		e.teamid as tid,
		e.title as tl,
		e.descript as dsc,
		e.datefrom as fdt,
		e.datefromtime as fdtt
	";

	public static function Event(TeamEventManager $man, $eventid){
		$db = $man->db;
		
		$leftJoins = array();
		foreach($man->fldExtEvent as $key => $value){ $leftJoins[$key] = true; }
		foreach($man->fldExtEventDetail as $key => $value){ $leftJoins[$key] = true; }
		
		$sql = "
			SELECT
				".TeamEventQuery::$EVENTFIELD."
		";

		// дополнительные поля текущего модуля
		foreach($man->fldExtEvent as $key => $value){
			$far = explode(",", $value);
			foreach($far as $f){
				$sql .= " ,".$key.".".trim($f)." ";
			}
		}
		
		// детальные дополнительные поля текущего модуля
		foreach($man->fldExtEventDetail as $key => $value){
			$far = explode(",", $value);
			foreach($far as $f){
				$sql .= " ,".$key.".".trim($f)." ";
			}
		}
		
		$sql .= "
			FROM ".$db->prefix."teamevent e
			INNER JOIN ".$db->prefix."team t ON e.teamid=t.teamid
		";
		
		foreach($leftJoins as $key => $value){
			$sql .= "
				LEFT JOIN ".$db->prefix.$key." ".$key." ON e.eventid=".$key.".eventid
			";
		}
		
		$sql .= "
			WHERE e.eventid=".bkint($eventid)." AND e.module='".bkstr($man->moduleName)."' 
				AND e.deldate=0 AND t.deldate=0
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function EventList(TeamEventManager $man, $teamid){
		$db = $man->db;
		$sql = "
			SELECT
				".TeamEventQuery::$EVENTFIELD."
		";
		
		foreach($man->fldExtEvent as $key => $value){
			$far = explode(",", $value);
			foreach($far as $f){
				$sql .= " ,".$key.".".trim($f)." ";
			}
		}
		
		$sql .= "
			FROM ".$db->prefix."teamevent e
			INNER JOIN ".$db->prefix."team t ON e.teamid=t.teamid
		";
		
		foreach($man->fldExtEvent as $key => $value){
			$sql .= "
				LEFT JOIN ".$db->prefix.$key." ".$key." ON e.eventid=".$key.".eventid
			";
		}
		
		$sql .= "
			WHERE e.module='".bkstr($man->moduleName)."' AND e.deldate=0 
				AND e.teamid=".bkint($teamid)." AND t.deldate=0
		";
		return $db->query_read($sql);
	}
	
	public static function EventAppend(Ab_Database $db, $module, $teamid, $d){
		$sql = "
			INSERT INTO ".$db->prefix."teamevent 
				(module, teamid, title, descript, datefrom, datefromtime, dateline) VALUES (
				'".bkstr($module)."',
				".bkint($teamid).",
				'".bkstr($d->tl)."',
				'".bkstr($d->dsc)."',
				".bkint($d->fdt).",
				".bkint($d->fdtt).",
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function EventUpdate(Ab_Database $db, $module, $teamid, $eventid, $d){
		$sql = "
			UPDATE ".$db->prefix."teamevent
			SET title='".bkstr($d->tl)."',
				descript='".bkstr($d->dsc)."',
				datefrom=".bkint($d->fdt).",
				datefromtime=".bkint($d->fdtt)."
			WHERE module='".bkstr($module)."' 
				AND eventid=".bkint($eventid)." AND teamid=".bkint($teamid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function EventRemove(Ab_Database $db, $module, $teamid, $eventid){
		$sql = "
			UPDATE ".$db->prefix."teamevent
			SET deldate=".TIMENOW."
			WHERE module='".bkstr($module)."' 
				AND eventid=".bkint($eventid)." AND teamid=".bkint($teamid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
}


?>
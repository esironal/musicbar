<?php

// Development Server Data!
define("DB_HOSTNAME", 'dbhost.cs.man.ac.uk');
define("DB_DATABASE", '2013_comp10120_x6');
define("DB_USERNAME", 'mbax2vh4');
define("DB_PASSWORD", 'musicbarisprettysweet');	

function getPDOHandle() {
	$dsn = 'mysql:dbname='.DB_DATABASE.';host='.DB_HOSTNAME;
	try{
		$db = new PDO($dsn, DB_USERNAME, DB_PASSWORD);
	}catch (PDOException $e){
		throw new Exception('Could not connect to database: '.$e->getMessage());
		return false;
	}
	$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	return $db;
}

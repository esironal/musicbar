<?php

if(!defined("PATH")){
  require_once('../../paths.php');
}

require_once(path('purse/database.php'));
require_once(path('application/classes/Users.php'));

$ret = array('status' => 0);
$users = new Users(getPDOHandle());

$email = $_POST['email'];
$password = $_POST['password'];

$ret['user'] = $users->login($email, $password);

echo json_encode($ret);

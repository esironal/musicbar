<?php

if(!defined("PATH")){
  require_once('../../paths.php');
}

require_once(path('purse/database.php'));
require_once(path('application/classes/Users.php'));

$ret = array('status' => 0);
$users = new Users(getPDOHandle());

$data['password'] = $_POST['password'];
$data['passwordc'] = $_POST['passwordc'];
$data['email'] = $_POST['email'];

$user = $users->register($data);
if(!$user){
  $ret['error'] = $users->error;
}else{
  $ret['user'] = $user;
}

echo json_encode($ret);

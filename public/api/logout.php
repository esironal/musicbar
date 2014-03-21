<?php

if(!defined("PATH")){
  require_once('../../paths.php');
}

require_once(path('purse/database.php'));
require_once(path('application/classes/Users.php'));

$users = new Users(getPDOHandle());
$user = $users->authenticate();

$users->logout($user->email);
header('Location: '.url('home'));

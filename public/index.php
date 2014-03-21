<?php namespace Purse;
// open purse
require_once('../paths.php');
require_once(path('purse/purse.php'));
require_once(path('purse/database.php'));
require_once(path('application/classes/Users.php'));

$users = new \Users(getPDOHandle());
$user = $users->authenticate();
$purse = new Purse();

$home = function(&$view) {
  global $user;
  $view = 'home';

  return array(
    'baseURL' => BASE_URL,
    'user' => $user
  );
};

$purse->action('/', $home);
$purse->action('/home', $home);

$purse->action('/register', function(&$view) {
  global $user;
  $view = 'register';

  return array(
    'baseURL' => BASE_URL,
    'user' => $user
  );
});

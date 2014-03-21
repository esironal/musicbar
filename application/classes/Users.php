<?php

if(!defined("PATH")){
  require_once('../../paths.php');
}

require_once(path('application/classes/BaseClass.php'));
require_once(path('application/classes/User.php'));

class Users extends BaseClass {
  private $db;
  public function __construct($db){
    parent::__construct();
    $this->db = $db;
  }
  public function getAllUsers(){
    $users = array(); 
    $getQuery = 'SELECT users.`id`,users.`email`,
    users.`sessionID`,users.`sessionIP`
    FROM `users`
    ORDER BY users.`id` ASC';
    $st = $this->db->prepare($getQuery);
    $st->execute();
    if($st->rowCount() > 0){
      $data = $st->fetchAll();
      foreach($data as $userData){
        $users[] = $this->userFromData($userData);
      }
    }else{
      $this->setError('get-users-no-users');
    }
    
    return $users;
  }
  public function getUserData($email){
    $importQuery = 'SELECT users.`id`, users.`email`,
    users.`sessionID`,users.`sessionIP`
    FROM `users`
    WHERE users.`email` = ?';
    $st = $this->db->prepare($importQuery);
    $st->execute(array($email));
    if($st->rowCount() == 1){
      $data = $st->fetchAll();
      return $data[0];
    }else{
      $this->setError('get-user-data-no-user');
      return false;
    } 
  }
  public function getUser($email){
    $user = new User() ;
    $importQuery = 'SELECT users.`id`, users.`email`,
    users.`sessionID`,users.`sessionIP`
    FROM `users`
    WHERE users.`email` = ?';
    $st = $this->db->prepare($importQuery);
    $st->execute(array($email));

    if($st->rowCount() == 1){
      $data = $st->fetchAll();
      $data = $data[0];
      $user = $this->userFromData($data);
    }else{
      $this->setError('get-user-no-user');
    }

    return $user;
  }
  public function userFromData($data){
    $user = new User();
    $user->id = $data['id'];
    $user->email = $data['email'];
    $user->sessionID = $data['sessionID'];
    $user->sessionIP = $data['sessionIP'];
    $user->loggedIn = true;
    return $user;
  }
  public function logout($email){
    setCookie('session', '', time()-60*60*24, "/");
    $st = $this->db->prepare('UPDATE `users` SET `sessionID`=NULL, `sessionIP`=NULL WHERE `email`=?');
    $st->execute(array($email));
  }
  public function changeEmail($data){
    $ret = array('status' => 0);
    $user = new User(); 
        $userData = $this->authenticate();  

        $st = $this->db->prepare('SELECT * FROM users where email=?');
        $st->execute(array($data['new-email']));

        if(!$this->isValidEmail($data['new-email'])) {
      $ret['status'] = -1;
            $ret['error']['code'] = 'invalid-email';
            $ret['error']['message'] = 'Invalid email address.';
            return $ret;
    } if(!$userData->loggedIn || $st->rowCount() != 0) {
      $ret['status'] = -1;
            $ret['error']['code'] = 'email-exists';
            $ret['error']['message'] = 'That email address is already registered.';
            return $ret;
    } if(!$this->checkPair($userData->email, $data['password'])) {
      $ret['status'] = -1;
      $ret['error']['code'] = 'incorrect-password';
      $ret['error']['message'] = 'The password is incorrect! Please try again.';
      return $ret;
    }
        
    $st = $this->db->prepare('UPDATE `users` SET `email`=? WHERE `id`=?');
    $st->execute(array($data['new-email'],$userData->id));

    return $ret;
  }
  public function register($data){
    $user = new User(); 

    if(empty($data['password']) || empty($data['email']) || empty($data['passwordc'])) {
      $this->setError('register-invalid-input');
      return false; 
    } if($data['password'] != $data['passwordc']){
      $this->setError('register-passwords-must-match');
      return false;
    } if($this->emailExists($data['email'])){
      $this->setError('register-email-exists');
      return false; 
    } if(!$this->isValidEmail($data['email'])){
      $this->setError('register-invalid-email');
      return false;
    }

    $st = $this->db->prepare('INSERT INTO `users` (`email`,`password`) VALUES (?,?)');
    $exec = $st->execute(array($data['email'], sha1($data['password'])));
    if(!$exec){
      $this->setError('register-database-error');
      return false;
    }

    $user = $this->authorize($data['email']);
    return $user;
  }
  public function authenticate(){
    $user = new User();

    if(!isset($_COOKIE['session']) || empty($_COOKIE['session'])){
      $this->setError('authenticate-no-session-cookie');
      return $user;
    }

    $st = $this->db->prepare('SELECT `email` FROM `users` WHERE `sessionID` = ? AND `sessionIP` = ?');
    $st->execute(array($_COOKIE['session'], $_SERVER['REMOTE_ADDR']));
    if($st->rowCount() != 1){
      $this->setError('authenticate-invalid-session');
      return $user;
    }
    $data = $st->fetchAll();
    $email = $data[0]['email'];

    $user = $this->getUser($email);
    
    return $user;
  }
  public function login($email, $password){
    if($this->checkPair($email,$password)){
      return $this->authorize($email);
    }else{
      return false;
    }
  }
  private function authorize($email){
    $sessionID = $this->generateSessionId();
    $this->setSessionCookie($sessionID);
    $this->setSessionDb($sessionID,$email);
    return $this->getUser($email);
  } 
  private function setSessionCookie($sessionID){
    setCookie('session', $sessionID, time()+60*60*24*7, "/");
  }
  private function setSessionDb($sessionID,$email){
    $st = $this->db->prepare('UPDATE `users` SET `sessionID`=?, `sessionIP`=? WHERE `email`=?');
    $st->execute(array($sessionID, $_SERVER['REMOTE_ADDR'], $email));
  }
  private function generateSessionId(){
    mt_srand(crc32(microtime()));
    return sha1(time() . microtime() . uniqid(mt_rand()) . mt_rand());
  }
  private function checkPair($email, $password){
    if(!$this->isValidEmail($email)) return false;

    $st = $this->db->prepare('SELECT `id` FROM `users` WHERE `email` = ? AND `password` = ?');
    $st->execute(array($email, sha1($password)));
    if($st->rowCount() == 1){
      return true;
    }else{
      return false;
    }
  }
  public function userIDExists($id){
    $st = $this->db->prepare('SELECT `id` FROM `users` WHERE `id` = ?');
    $st->execute(array($id));
    if($st->rowCount() == 1){
      return true;
    }else{
      return false;
    }
  }
  public function emailExists($email){
    $st = $this->db->prepare('SELECT `id` FROM `users` WHERE `email` = ?');
    $st->execute(array($email));
    if($st->rowCount() == 1){
      return true;
    }else{
      return false;
    }
  }
    private function isValidEmail($email) {
        if(!filter_var($email, FILTER_VALIDATE_EMAIL)) return 0;
        else return 1;
    }
}

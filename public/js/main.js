$(function () {
  $("#login-input-submit").click(function() {
    $.post('api/login.php', {
      email: $('#login-input-email').val(),
      password: $('#login-input-password').val()
    }, null, 'json').done(function(data) {
      if (typeof(data.user) != "undefined" && data.user.loggedIn == true) {
        window.location.href = 'home';
      } else {
        console.log(data);
      }
    });
    return false;
  });
});

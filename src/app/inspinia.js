$(document).ready(function () {
  // Full height
  function fix_height() {
    var navbarHeigh = $('#sidebar-wrapper').height();
    $('#page-wrapper').css("height", navbarHeigh + "px");
    $('body').css("height",  navbarHeigh+ "px");
  }

  $(window).bind("load resize scroll", function () {
    if (!$("body").hasClass('body-small')) {
      fix_height();
    }
  });

  setTimeout(function () {
    fix_height();
  })
});

// Minimalize menu when screen is less than 768px
$(function () {
  $(window).bind("load resize", function () {
    if ($(this).width() < 769) {
      $('body').addClass('body-small')
    } else {
      $('body').removeClass('body-small')
    }
  })
});

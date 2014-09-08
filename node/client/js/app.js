(function() {
  'use strict';
  // create a new websocket
  var socket = io.connect('http://localhost:8000'),
    // select all the DOM elements needed for this experiment
    $body = $('body'),
    $btn = $('button'),
    $lightStatus = $('span', $btn),
    // the light must be off by default
    lightStatus = '0',
    // toggle the light status using the button on the page
    toggleLightStatus = function() {
      // switch the lightStatus var ...
      lightStatus = lightStatus === '0' ? '1' : '0';
      // pass its value to the nodejs server via websocket
      socket.emit('lightStatus', lightStatus);

    },
    onSocketNotification = function(data) {
      // print all the messages coming from the arduino board
      var $div = $('<center>');
      $div.html(data);
      $body.append($div);
      $div.delay(1000).fadeOut(function() {
        $div.remove();
      });
      // filter the light status notifications
      if (/[01!]/gi.test(data)) {
        // update the text inside the button
        $lightStatus.text(data);
      }

    };

  // Set listeners
  socket.on('notification', onSocketNotification);
  $btn.on('click', toggleLightStatus);

  // turn off the light by default on any new connection
  socket.emit('lightStatus', lightStatus);
}());
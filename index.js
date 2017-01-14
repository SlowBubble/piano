  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBdSiXI5w3pKNgUMxxXIQE77VZgU7b0eUs",
    authDomain: "piano-aa8e0.firebaseapp.com",
    databaseURL: "https://piano-aa8e0.firebaseio.com",
    storageBucket: "piano-aa8e0.appspot.com",
    messagingSenderId: "154214881971"
  };
  firebase.initializeApp(config);


var pedalOn = false;
var volumeRange = 30;
//var transposeRange = 0;


$(function() {
  // Handler for .ready() called.
    $('#pedal-toggle').click(function(){
        pedalOn = !pedalOn; 
        console.log('pedal on status: ', pedalOn);
    });
    $('#volume-range').on('input', function () {
        volumeRange = parseInt($(this).val());
    });
    $('#transpose-range').on('input', function () {
        simpleKeyboard.shift = parseInt($(this).val());
    });
});

window.onload = function () {
	MIDI.loadPlugin({
		soundfontUrl: "lib/midi.js/soundfont/",
		instrument: "acoustic_grand_piano",
		onprogress: function(state, progress) {
			console.log(state, progress);
		},
		onsuccess: function() {
            console.log('Piano is loaded.');
            
            loadSound();
            simpleKeyboard.connectKeyToKeyboard();
            simpleKeyboard.connectKeyboardToDisplay();
			if (IS_IOS) {
                simpleKeyboard.connectTouchToKeyboard(); 
            } else {
                simpleKeyboard.connectMouseToKeyboard();
            }
		}
	});
};

IS_IOS = navigator.userAgent.match(/(iPhone|iPad|webOs|Android)/i);

loadSound = function() {
    $(window).off('keyboardDown.sound');
      $(window).on('keyboardDown.sound', function(evt, data) {
          if (typeof data.noteNumber !== 'undefined') {
            data.channel = data.channel || DEFAULT_CHANNEL;
            MIDI.noteOn(data.channel, data.noteNumber, damp(data.velocity, data.noteNumber, volumeRange));
          }
      });

      $(window).off('keyboardUp.sound');
      $(window).on('keyboardUp.sound', function(evt, data) {
          if (typeof data.noteNumber !== 'undefined' && !data.pedalOn) {
            data.channel = data.channel || DEFAULT_CHANNEL;
            MIDI.noteOff(data.channel, data.noteNumber);
          }
      });
    }
function damp(velocity, note, volumeRange) {
  return velocity * volumeRange / 100;
}
simpleKeyboard = {
  channel: 0,
  velocity: 80,
  shift: 0,
  hasPedal: true,

  connectMouseToKeyboard: function() {
    var self = this;

    $('.key').off('mousedown.keyboard');
    $('.key').on('mousedown.keyboard', function(evt){
      var keyCode = parseInt($(evt.target).closest('.key').data('keyCode'));
      var noteNumber = convertKeyCodeToNote(keyCode);

      if (typeof noteNumber !== "undefined") {
        noteNumber = self.adjustShift(noteNumber);
        $(window).trigger('keyboardDown', {
          time: new Date().getTime(),
          keyCode: keyCode,
          noteNumber: noteNumber,
          channel: self.channel,
          velocity: self.velocity,
          pedalOn: pedalOn,
          userTriggered: true,
        });
      }
    });

    $('.key').off('mouseup.keyboard');
    $('.key').on('mouseup.keyboard', function(evt) {
      var keyCode = parseInt($(evt.target).closest('.key').data('keyCode'));
      var noteNumber = convertKeyCodeToNote(keyCode);

      if (typeof noteNumber !== "undefined") {
        noteNumber = self.adjustShift(noteNumber);
        $(window).trigger('keyboardUp', {
          time: new Date().getTime(),
          keyCode: keyCode,
          noteNumber: noteNumber,
          channel: self.channel,
          velocity: self.velocity,
          pedalOn: pedalOn,
          userTriggered: true,
        });
      }
    })
  },

  connectTouchToKeyboard: function() {
    var self = this;

    $('.key').off('touchstart.keyboard');
    $('.key').on('touchstart.keyboard', function(evt){
      var keyCode = parseInt($(evt.target).closest('.key').data('keyCode'));
      var noteNumber = convertKeyCodeToNote(keyCode);

      if (typeof noteNumber !== "undefined") {
        noteNumber = self.adjustShift(noteNumber);
        $(window).trigger('keyboardDown', {
          time: new Date().getTime(),
          keyCode: keyCode,
          noteNumber: noteNumber,
          channel: self.channel,
          velocity: self.velocity,
          pedalOn: pedalOn,
          userTriggered: true,
        });
      }
    });

    $('.key').off('touchend.keyboard');
    $('.key').on('touchend.keyboard', function(evt) {
      var keyCode = parseInt($(evt.target).closest('.key').data('keyCode'));
      var noteNumber = convertKeyCodeToNote(keyCode);

      if (typeof noteNumber !== "undefined") {
        noteNumber = self.adjustShift(noteNumber);
        $(window).trigger('keyboardUp', {
          time: new Date().getTime(),
          keyCode: keyCode,
          noteNumber: noteNumber,
          channel: self.channel,
          velocity: self.velocity,
          pedalOn: pedalOn,
          userTriggered: true,
        });
      }
    });
  },

  connectKeyToKeyboard: function() {
    var self = this;
    var downKeys = {};

    $(window).on('keydown.keyboard', function(evt) {
      if (typeof event !== 'undefined') {
        var d = event.srcElement || event.target;

        var inInputField = (d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT' || d.type.toUpperCase() === 'PASSWORD' || d.type.toUpperCase() === 'FILE')) 
                 || d.tagName.toUpperCase() === 'TEXTAREA';
      }
      
      if (inInputField) return ;

      var keyCode = fixKeyCode(evt.keyCode);
      if (downKeys[keyCode] === true) {
        return ;
      } else {
        downKeys[keyCode] = true;
      }

      var noteNumber = convertKeyCodeToNote(keyCode);

      if (typeof noteNumber !== "undefined") {
        noteNumber = self.adjustShift(noteNumber);
        
        $(window).trigger('keyboardDown', {
          time: new Date().getTime(),
          keyCode: keyCode,
          noteNumber: noteNumber,
          channel: self.channel,
          velocity: self.velocity,
          pedalOn: pedalOn,
          userTriggered: true,
        });

      } else {
        //TODO
        self.adjustSettings(keyCode);
      }

      // prevent backspace from navigating back in the browser
      if (evt.which === 8) {
        evt.preventDefault();
      }
    });

    $(window).on('keyup.keyboard', function(evt) {
      var keyCode = fixKeyCode(evt.keyCode);

      delete downKeys[keyCode];

      var noteNumber = convertKeyCodeToNote(keyCode);

      if (typeof noteNumber !== "undefined") {
        noteNumber = self.adjustShift(noteNumber);
        $(window).trigger('keyboardUp', {
          time: new Date().getTime(),
          keyCode: keyCode,
          noteNumber: noteNumber,
          channel: self.channel,
          velocity: self.velocity,
          pedalOn: pedalOn,
          userTriggered: true,
        });
      }
    });
  },

  connectKeyboardToDisplay: function() {
    var self = this;

    $(window).on('keyboardDown.display', function(evt, data) {
      var dom = $('[data-key-code="' + data.keyCode + '"]');
      if (data.channel !== DRUM_CHANNEL) {
        if (data.userTriggered){
          dom.addClass('keydown');
        }
        dom.html('<span>'+noteToName(data.noteNumber, true)+'</span>');
      }
    });

    $(window).on('keyboardUp.display', function(evt, data) {
      var dom = $('[data-key-code="' + data.keyCode + '"]');
      dom.html('<span>' + dom.data('content') + '</span>');
      
      dom.removeClass('keydown');
    });
  },

  adjustShift: function(noteNumber) {
      console.log(this.shift)
    noteNumber += this.shift;
    return noteNumber;
  },

  adjustSettings: function(keyCode) {
    // if (keyCode === 38) {
    //   this.shift++;
    // } else if (keyCode === 40){
    //   this.shift--;
    // } 
    // else if (keyCode === 37) {
    //   this.velocity -= 30;
    // } else if (keyCode === 39) {
    //   this.velocity += 30;
    // }
  },
}

////// helpers
function fixKeyCode(keyCode) {
  // firefox incompatibility
  if (keyCode === 59) {
    keyCode = 186;
  } else if (keyCode === 61) {
    keyCode = 187;
  } else if (keyCode === 173) {
    keyCode = 189;
  }

  return keyCode
}

function convertKeyCodeToNote(keyCode) {
  return keyCodeToNote[keyCode];
}

noteNumberToAoeui = function(noteNumber) {
    var conversion = {
      41: 'j',  
      42: 'k',
      43: 'u',
      45: '3',
      47: '`',
      48: '1',
      49: '2',
      50: "'",
      51: ',',
      52: 'a',
      53: ';',
      54: 'q',
      55: 'o',
      56: 'e',
      57: '.',
      58: 'p',
      59: '4',
      60: '5',
      61: '6',
      62: 'y',
      63: 'f',
      64: 'i',
      65: 'x',
      66: 'b',
      67: 'i',
      68: 'h',
      69: 'g',
      70: 'c',
      71: '8',
      72: '9',
      73: '0',
      74: 'r',
      75: 'l',
      76: 'n',
      77: 'v',
      78: 'z',
      79: 's',
      80: '-',
      81: '/',
      82: '=',
      83: ']',
      84: 'del',
      86:  '\\',
      88: '[',
      89: 'm',
      90: 'w',
      91: 't',
      93: '7',
    }
  var ret = conversion[noteNumber];
  if (!ret) ret = noteNumber.toString();

  return ret;
}

noteToName = function(noteNumber, alphabet) {
  noteNumber = (noteNumber - 60) % 12;

  if (noteNumber < 0) {
    noteNumber += 12;
  }

  if (alphabet) {
    if (1) {
      var conversion = {
        0: 'C',
        1: 'C\u266F',
        2: 'D',
        3: 'D\u266F',
        4: 'E',
        5: 'F',
        6: 'F\u266F',
        7: 'G',
        8: 'G\u266F',
        9: 'A',
        10: 'A\u266F',
        11: 'B',
      };
    } else {
      var conversion = {
        0: 'C',
        1: 'D\u266D',
        2: 'D',
        3: 'E\u266D',
        4: 'E',
        5: 'F',
        6: 'G\u266D',
        7: 'G',
        8: 'A\u266D',
        9: 'A',
        10: 'B\u266D',
        11: 'B',
      };
    }


  } else {
    var conversion = {
      0: 'DO',
      1: 'DI',
      2: 'RE',
      3: 'RI',
      4: 'MI',
      5: 'FA',
      6: 'FI',
      7: 'SO',
      8: 'SI',
      9: 'LA',
      10: 'LI',
      11: 'TI',
    };
  }

  return conversion[noteNumber];
}


keyCodeToNote = {
  67: 41,
  86: 42,
  70: 43,
  51: 45,
  192: 47,
  49: 48, // C
  50: 49,
  81: 50,
  87: 51,
  65: 52,
  90: 53,
  88: 54,
  83: 55,
  68: 56,
  69: 57,
  82: 58,
  52: 59,
  53: 60, // C
  54: 61,
  84: 62,
  89: 63,
  71: 64,
  66: 65,
  78: 66,
  72: 67,
  74: 68,
  85: 69,
  73: 70,
  56: 71,
  57: 72, //C
  48: 73,
  79: 74,
  80: 75,
  76: 76,
  190: 77,
  191: 78,
  186: 79,
  222: 80,
  219: 81,
  221: 82,
  187: 83,
  8: 84, //C
  220: 86,
  189: 88,
  77: 89,
  188: 90,
  75: 91,
  55: 93,
};

noteToKeyCode = {};

for (prop in keyCodeToNote) {
  noteToKeyCode[keyCodeToNote[prop]] = parseInt(prop);
}

convertNoteToKeyCode = function(noteNumber) {
  var keyCode = noteToKeyCode[noteNumber];

  if (!keyCode) {
    while (noteNumber > 84) {
      noteNumber -= 12;
    } 
    while (noteNumber < 47) {
      noteNumber += 12;
    }
    keyCode = noteToKeyCode[noteNumber];
  }

  return keyCode;
}

var DEFAULT_CHANNEL = 0;
var DRUM_CHANNEL = 9;
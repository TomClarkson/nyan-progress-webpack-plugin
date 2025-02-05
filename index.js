var clor = require('clor');
var webpack = require('webpack');

require('object.assign').shim();

function prepareNyan(nyan, colorMap, mapColors) {
  return nyan.map(function(row, idx) {
    return row.split('').reduce(function (arr, chr, j) {
      var color = colorMap[idx][j];
      var last = arr[arr.length - 1];
      if (last && last.colorCode === color) {
        last.text += chr;
        return arr;
      } else {
        return arr.concat({
          colorCode: color,
          color: mapColors[color] || function(l) { return l; },
          text: chr
        });
      }
    }, []);
  });
}

var nyanProgress = prepareNyan([
  ' ,--------,     ',
  ' │▗▝ ▞ ▝ ˄---˄  ',
  '~│ ▞  ▞ ❬.◕‿‿◕.❭',
  ' `w-w---- w w   '
], [
  ' ggggggggggg    ',
  ' gMMMMMMMggggg  ',
  'ggMMMMMMgwwwwwwg',
  ' gggggggggggg   '
], {
  g: function(l) { return l; },
  M: function(l) { return l.bold.magenta.inverse; },
  w: function(l) { return l.bold; }
});

var nyanSuccess = prepareNyan([
  ' ,--------,      ,------.',
  ' │▗▝ ▞ ▝ ˄---˄  / Nice! |',
  '~│ ▞  ▞ ❬.◕‿‿◕.❭--------’',
  ' `w-w---- w w            '
], [
  ' ggggggggggg     wwwwwwww',
  ' gMMMMMMMggggg  wwwwwwwww',
  'ggMMMMMMgwwwwwwgwwwwwwwww',
  ' gggggggggggg            '
], {
  g: function(l) { return l; },
  M: function(l) { return l.bold.magenta.inverse; },
  w: function(l) { return l.bold; }
});

var rainbow = [
  [
    function(l) { return l.red; },
    function(l) { return function(text) { return l(text.replace(/./g, ' ')); }; }
  ],
  [
    function(l) { return l.bgRed.yellow; },
    function(l) { return l.bold.red.bgRed; }
  ],
  [
    function(l) { return l.bgYellow.green; },
    function(l) { return l.bold.yellow.bgYellow; }
  ],
  [
    function(l) { return l.bgGreen.blue; },
    function(l) { return l.bold.green.bgGreen; }
  ],
  [
    function(l) { return l.inverse.blue; },
    function(l) { return l.bold.blue.bgBlue; }
  ]
];

function drawRainbow(line, colors, width, step) {
  var wave = ['\u2584', '\u2591'];
  var text = '';
  var idx = step;
  for (var i = 0; i < width; i++) {
    text += wave[idx % 2];
    if((step + i) % 4 === 0) {
      line = colors[idx % 2](line)(text);
      text = '';
      idx++;
    }
  }
  return text ? colors[idx % 2](line)(text) : line;
}

function drawNyan(nyan, line, idx) {
  return nyan[idx].reduce(function(l, obj) {
    return obj.color(l)(obj.text);
  }, line);
}

function onProgress(progress, message, step, erase, options) {
  var progressWidth = Math.ceil(progress * 50);

  if (erase)
    options.logger(clor.cursorUp(rainbow.length + 2).string);

  for (var i = 0; i < rainbow.length; i++) {
    var line = drawRainbow(clor.eraseLine, rainbow[i], progressWidth, step);
    var nyanLine = i + ((step % 8 < 4) ? -1 : 0);
    if (nyanLine < 4 && nyanLine >= 0) {
      line = drawNyan(progress === 1 ? nyanSuccess : nyanProgress, line, nyanLine);
    }

    options.logger(line.string);
  }
  options.logger(clor.eraseLine.cyan(message).string);
}

module.exports = function NyanProgressPlugin(options) {
  var timer = 0;
  var shift = 0;

  options = Object.assign({
    debounceInterval: 180,
    logger: console.log.bind(console) // eslint-disable-line no-console
  }, options);

  return new webpack.ProgressPlugin(function(progress, message) {
    var now = new Date().getTime();
    if (progress === 0) {
      process.nextTick(onProgress.bind(null, progress, message, shift++, false, options));
    } if (progress === 1) {
      onProgress(progress, message, shift++, true, options);
    }
    else if (now - timer > options.debounceInterval) {
      timer = now;
      process.nextTick(onProgress.bind(null, progress, message, shift++, true, options));
    }
  });
};

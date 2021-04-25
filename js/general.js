const { func } = require("prop-types");

var record = false;
var training_points = [];
var training_labels = [];


function toggleRecord () {
  record = !record;
  // let us know it is recording
  el = document.getElementById('test')
  el.textContent = record;

  // add the records into the memory and update screen stats
  if (record==false) {
    const trainText = 'Test points: '+training_points.length+ '\n One example: \n Label:'+training_labels[0]+'\n:Points:' +JSON.stringify(training_points[0]);
    document.getElementById('results').textContent = trainText;
  }
};

var takescreen = false;
function takeScreen() {
  takescreen = true;
};

function downloadData () {
  // download the data
  var csvContent = "data:text/csv;charset=utf-8,"; 
  csvContent += "label;bbx;bby;leye.x;leye.y;reye.x;reye.y;nose.x;nose.y;mouth.x;mouth.y;lear.x;lear.y;rear.x;rear.y";
  var line;
    for(let i = 0; i < training_points.length; i++){ 
      line = training_labels[i]+ ';'+  training_points[i];
      csvContent = csvContent+line;
  }
  // Create text document — only saves 1st link in text doc
  var textDoc = document.createElement('a');
  textDoc.href = csvContent;
  textDoc.target = '_blank';
  textDoc.download = 'data.csv';
  textDoc.click();
};

function getJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};

var word_list;
function loadJson() {
  getJSON('/models/word_button.json', function(err, data) {
    if (err !== null) {
      alert('Something went wrong: ' + err);
    } else {
      word_list = new Map( Object.entries( data ) );
    }
  });
}

// button stuff
var is_over;
var curr_button;
let CLICK_TIME=1000;
var last_click_time;

// words
var curr_seq;
var final_words;

function resetKeyboard() {
  curr_seq = '';
  final_words = '';
}

// control processing
var isProcessing;
function beautifyOption(option) {
  var span = document.createElement('span');
  span.textContent = option;
  span.className = 'badge bg-primary w-20';
  return span;
}

function buttonText(button, text) {
  var bt = document.getElementById(button);
  bt.innerHTML = '';
  // create the tags for each of the options
  if (typeof text === 'undefined') {
    return;
  }
  text.split(",").map(e=> {
    bt.appendChild(beautifyOption(e));
  });
  
  // bt.set = btText.replace(',');
};

function phraseText(text) {
  if (typeof text === 'undefined') {
    return;
  }
  var bt = document.getElementById('phrase');
  bt.textContent = bt.textContent+ ' '+ text;
};

function drawLetterButtons() {
  let btGroups = [
    ['a', 'g', 's', 'r', 'h', 'x'],
  ['e', 'd', 'f', 'y', 'c'],
  ['i', 'q', 'p', 'b', 'n'],
  ['o', 'w', 'j', 'z', 't'],
  ['u', 'm', 'k', 'v', 'l'],
    ["Accept"]
  ];

  // create the initial buttons
  for(var i=0; i<6; i++) {
    buttonText('bt'+i,btGroups[i].toString());
  }
};

function drawWordButtons(pWords) {
  // create the initial buttons
  for(var i=0; i<6; i++) {
    buttonText('bt'+i, pWords[i]);
  }
};

function init() {
  // button stuff
  is_over = false;
  curr_button = -1;
  last_click_time = 0;

  // words
  curr_seq = "";
  final_words = '';
  isProcessing = false;
  loadJson();

  // create the initial buttons
  drawLetterButtons();
};
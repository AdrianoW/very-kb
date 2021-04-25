const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const pred_label = ['Nothing', 'down', 'left', 'right', 'up'];
const model = await tf.loadLayersModel('http://127.0.0.1:5500/models/modeljs.json/model.json');

// stop the logging
console.log = function(){}; 

function createFeatures(pred) {
  var bb = pred.boundingBox;
  var land = pred.landmarks;
  var text = bb.xCenter+ ';' + bb.yCenter + ';'
  for(let i = 0; i < land.length-1; i++){ 
      text = text + land[i].x + ';' + land[i].y + ';';
    }
  text = text + land[land.length-1].x + ';' + land[land.length-1].y + '\n';
  return text;      
}
function argMax(array) {
return [].reduce.call(array, (m, c, i, arr) => c > arr[m] ? i : m, 0)
}

async function predPosition(faceFeatures, canvasCtx) {
  var intext = createFeatures(faceFeatures).split(';');
    var intensor = tf.tensor(intext, [1, 14], 'float32');
    var preds = await model.predict(intensor).data();
    
    canvasCtx.fillStyle = "blue";
    canvasCtx.font = "bold 16px Arial";
    // console.log(tf.argMax(preds.arraySync()));
    const pred_text = pred_label[argMax(preds)];
    canvasCtx.fillText(pred_text, 15,15);
};

function drawLine(canvasCtx, radius, angle, cx, cy, text='') {
  let rad = angle * (Math.PI/180);
  canvasCtx.beginPath();
  canvasCtx.moveTo(cx, cy);
  let xx = radius *  Math.cos(rad);
  let yy = radius *  Math.sin(rad);
  canvasCtx.lineTo(cx+xx, cy+yy);
  canvasCtx.stroke();

  // canvasCtx.font = "bold 16px Arial";
  // canvasCtx.fillText(text, cx+xx,cy+yy);
}

function detectQuadrant (x,y, cx, cy){
    var a = Math.atan2(y - cy, x - cx)*180/Math.PI+180;
    var quadrant = Math.trunc(a/60);
    return quadrant;
}

function check_a_point(px, py, cx, cy, r) {
  var dist_points = (px - cx) * (px - cx) + (py - cy) * (py - cy);
  r *= r;
  if (dist_points > r) { 
      return true;
  }
  return false;
}

function drawWords(ctx, curr_seq, final_words, last_click_time) {
  ctx.fillStyle = "blue";
  ctx.font = "bold 16px Arial";
  // ctx.fillText(curr_seq, 45,15);
  ctx.fillText(final_words, 45,45);
  // ctx.fillText(last_click_time, 45,60);
}

function drawOptions(){

}

function acceptWord() {
  drawWordButtons(drawWordButtons);
}

const kbMode = Object.freeze({"typing":1, "word_selection":2})
var curKbMode = kbMode.typing;

function process_click() {
  // process the click that the user did according to the current keyboard
  switch (curKbMode) {
    case kbMode.typing: 
      if (curr_button!=5 && curr_button>=0) {
        curr_seq += curr_button.toString();
        final_words = word_list.get('c'+curr_seq);
      } else {
        // check if we get nowhere
        if (typeof final_words == 'undefined') {
          resetKeyboard();
          break;
        }
        drawWordButtons(final_words);
        curKbMode = kbMode.word_selection;
      }
      break;
    case kbMode.word_selection:
      if (curr_button!=5 && curr_button>=0) {
        phraseText(final_words[curr_button]);
      } 
      drawLetterButtons();
      resetKeyboard();
      
      curKbMode = kbMode.typing;
      break;
  }
  
}

 var time_since_last_click;
 var nose_pos;
 let radius = 60
 var smallRadius = 30; 
 var cx;
 var cy; 
 let CLICK_TIME = 1000; // in miliseconds

  function onResults(results) {

    // detect nose point
    nose_pos= results.detections[0].landmarks[2];
    nose_pos.x = nose_pos.x*canvasElement.width; 
    nose_pos.y = nose_pos.y*canvasElement.height;

    // center of the box
    cx = canvasElement.width * results.detections[0].boundingBox.xCenter;
    cy = canvasElement.height * results.detections[0].boundingBox.yCenter;
    radius = results.detections[0].boundingBox.width*canvasElement.width < 140 ? results.detections[0].boundingBox.width*canvasElement.width/2: 60;
    smallRadius = radius/2;

    // detect if there was a click or not
    time_since_last_click = Date.now() - last_click_time;
      if(time_since_last_click>CLICK_TIME) {
        if (check_a_point(nose_pos.x, 
                      nose_pos.y, cx,cy, smallRadius)) {
          if (is_over==true) {
            is_over = false;

            // it is a click
            // console.log('Clicked' + curr_button);
            last_click_time=Date.now();

            process_click();

            // reset the button
            curr_button = -1;
            
          }
        } else {
          // only start counting again when a certain time has passed since last  click
          is_over = true;
          curr_button = detectQuadrant(nose_pos.x, 
                      nose_pos.y, cx,cy);
        }
      }

    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.detections.length > 0) {
      drawRectangle(
          canvasCtx, results.detections[0].boundingBox,
          {color: 'blue', lineWidth: 4, fillColor: '#00000000'});
      // drawLandmarks(canvasCtx, results.detections[0].landmarks, {
      //   color: 'red',
      //   radius: 5,
      // });

    if (takescreen) {
      takescreen=false;
      var ce = document.getElementsByClassName('output1_canvas')[0];
      var ceCtx = ce.getContext('2d');

      ceCtx.save();
      ceCtx.clearRect(0, 0, ce.width, ce.height);

      var le =results.detections[0].landmarks[0];
      
      ceCtx.drawImage(
        results.image,
        le.x*canvasElement.width-20,
        le.y*canvasElement.height-20,
        40,
        40, 0,0,40,40);
      ceCtx.restore();
    }

      // write a text
      // canvasCtx.fillStyle = "blue";
      // canvasCtx.font = "bold 16px Arial";
      // canvasCtx.fillText(bb.xCenter*canvasElement.width+' '+bb.yCenter*canvasElement.height, 15,15);

      // draw the blue circle interface
      let circle2 = new Path2D();  // <<< Declaration
      circle2.arc(nose_pos.x, nose_pos.y, 5, 0, 2 * Math.PI, false);
      canvasCtx.fillStyle = 'blue';
      canvasCtx.fill(circle2);
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = '#000066';
      canvasCtx.stroke(circle2);

      // draw the 2 circles
      let circle = new Path2D();  // <<< Declaration
      circle.arc(cx, cy, smallRadius, 0, 2 * Math.PI, false);
      // canvasCtx.fillStyle = 'blue';
      // canvasCtx.fill(circle);
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = '#000066';
      canvasCtx.stroke(circle);

      let circle1 = new Path2D();  // <<< Declaration
      circle1.arc(cx, cy, radius, 0, 2 * Math.PI, false);
      // canvasCtx.fillStyle = 'blue';
      // canvasCtx.fill(circle);
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = '#000066';
      canvasCtx.stroke(circle1);

      // draw circle interface
      for(var i=0; i<6; i++){
        drawLine(canvasCtx, radius, i*60, cx,cy, i.toString());
      }
      
      //draw current word
      drawWords(canvasCtx, curr_seq, final_words, curr_button);

      // predict where head is looking
      //predPosition(results.detections[0], canvasCtx);

      // right eye, left eye, nose tip, mouth center, right ear tragion, and left ear tragion
      // left eye, right eye, nose tip, mouth center, left ear tragion, and right ear tragion
      if (record == true) {
        const label = document.getElementById('label').value;
        training_labels.push(label);
        training_points.push(createFeatures(results.detections[0]));
      }

    }
    canvasCtx.restore();
    
  }
  
  // create the facedetection structure to do the face detection
  const faceDetection = new FaceDetection({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.0/${file}`;
  }});
  faceDetection.setOptions({
    minDetectionConfidence: 0.5,
    selfieMode: true
  });
  faceDetection.onResults(onResults);
  
  // for every frame of the camera do something
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await faceDetection.send({image: videoElement});
    },
    width: 640,
    height: 480,
    frameRate: {max: 10}
  });
  camera.start();
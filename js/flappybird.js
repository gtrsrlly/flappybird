console.log('Hello world');

function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
} catch (e) {
    return false;
  }
}

function getUrlVars() {
  vars = [];
  var hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for(var i = 0; i && hashes.length; i++) {
    hash = hashes[i].split('=');
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
	console.log('Extracted variables from $_GET: ');
	console.log(vars);
  return vars;
}

var GAI = 'UA-48203742-1';
var GAD = 'b1rd.tk';
(function (i, s, o, g, r, a, m) {
	i['GoogleAnalyticsObject'] = r;
	i[r] = i[r] || function () {
		(i[r].q = i[r].q || []).push(arguments)
	}, i[r].l = 1 * new Date();
	a = s.createElement(o),
	m = s.getElementsByTagName(o)[0];
	a.async = 1;
	a.src = g;
	m.parentNode.insertBefore(a, m)
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
ga('create', GAI, GAD);
ga('send', 'pageview');
console.log('Succesfully initialized Google Analitics with Indentificator: ' + GAI + ' and Domain Name: ' + GAD);

window.SAVEMODE = 'none';
window.USERLEVEL = 0;
window.USERNAME = 'Anonimous';
window.USERSURNAME = 'User';
window.USERID = 0;
		
var stage, w, h, loader, obstacle1height, obstacle2height, obstacle3height, startX, startY, wiggleDelta;
var background, runscreen, bird, ground, obstacle, bottomObstacle, obstacles, rotationDelta, counter, counterOutline;
var started = false;
var startJump = false;
var jumpAmount = 120;
var jumpTime = 266;
var dead = false;
var KEYCODE_SPACE = 32;
var gap = 250;
var masterObstacleDelay = 78;
var obstacleDelay = masterObstacleDelay;
var counterShow = false;
var GODMODE = 'OFF';
document.onkeydown = handleKeyDown;

if(supports_html5_storage){
	window.SAVEMODE = 'local';
	console.info('SaveMode switched to Local');
}

var URLGETS = getUrlVars();
if(URLGETS['api_url'] !== undefined){
	window.SAVEMODE = 'vk';
	console.info('SaveMode switched to VK');
}
if(window.SAVEMODE == 'local' && (localStorage.getItem('userlevel') > 0)){
	window.USERLEVEL = localStorage.getItem('userlevel');
}

if(window.SAVEMODE == 'vk'){
	VK.init(function () {
		console.log('Succesfully initialized VK JavaScript API');
	});
	VK.api('isAppUser', {}, function (data) {
		if (data.response == 1) {
			console.log('Current user already installed this app!');
		}
	});
	VK.api('users.get', {}, function (data) {
		if (data.response) {
			window.USERNAME = data.response[0]['first_name'];
			window.USERSURNAME = data.response[0]['last_name'];
			window.USERID = data.response[0]['uid'];
		} else {
			console.warn('Cant\'t get User Information. Let\'s use default!');
		}
		console.log('Welcome, ' + window.USERNAME + ' ' + window.USERSURNAME + '! Your ID: ' + window.USERID);
		VK.api('secure.getUserLevel', {user_ids:window.USERID}, function (data){
			if(data.response){
				window.USERLEVEL = data.response[0]['level'];
			} else {
				console.log(data);
				console.warn('Cant\'t get User Level. Let\'s use default!');
			}
			console.log('User level: ' + window.USERLEVEL);
			init();
		});
	});
} else {
	init();
}

function init(){
	console.log('Initializing game...');
	createjs.MotionGuidePlugin.install();
	stage = new createjs.Stage("testCanvas");
	console.log('Touch enabled!');
	createjs.Touch.enable(stage);
	//if(SAVEMODE == 'local'){
	//	stage.canvas.width = document.body.clientWidth;
	//	stage.canvas.height = document.body.clientHeight;
	//}

	w = stage.canvas.width;
	h = stage.canvas.height;
	console.log('Canvas height: ' + h + 'px and width: ' + w + 'px');

	manifest = [{
		src: "img/bird.png",
		id: "bird"
	}, {
		src: "img/background2.png",
		id: "background"
	}, {
		src: "img/runscreen.png",
		id: "runscreen"
	}, {
		src: "img/ground.png",
		id: "ground"
	}, {
		src: "img/obstacle.png",
		id: "obstacle"
	}, {
		src: "img/restart.png",
		id: "start"
	}, {
		src: "img/share.png",
		id: "share"
	}, {
		src: "fonts/FB.eot"
	}, {
		src: "fonts/FB.svg"
	}, {
		src: "fonts/FB.ttf"
	}, {
		src: "fonts/FB.woff"
	}];

	loader = new createjs.LoadQueue(false);
	loader.addEventListener("complete", handleComplete);
	loader.loadManifest(manifest);
	console.log('Resourses succesfully loaded!');
}

function handleComplete() {

	console.log('Let\'s put some background...');
	
	var backgroundImg = loader.getResult("background");
	background = new createjs.Shape();
	background.graphics.beginBitmapFill(backgroundImg).drawRect(0, 0, w + backgroundImg.width, backgroundImg.height);
	background.tileW = backgroundImg.width;
	background.y = 0;

	var runscreenImg = loader.getResult("runscreen");
	runscreen = new createjs.Shape();
	runscreen.graphics.beginBitmapFill(runscreenImg).drawRect(0, 0, runscreenImg.width, runscreenImg.height);
	runscreen.tileW = 100;
	runscreen.y = 300;
	runscreen.x = w / 2 - 50;

	console.log('...put some grass...');
	var groundImg = loader.getResult("ground");
	ground = new createjs.Shape();
	ground.graphics.beginBitmapFill(groundImg).drawRect(0, 0, w + groundImg.width, groundImg.height);
	ground.tileW = groundImg.width;
	ground.y = h - groundImg.height;

	console.log('...defining animations...');
	var data = new createjs.SpriteSheet({
		"images": [loader.getResult("bird")],
		//set center and size of frames, center is important for later bird roation
		"frames": {
			"width": 92,
			"height": 64,
			"regX": 46,
			"regY": 32,
			"count": 3
		},
		// define two animations, run (loops, 0.21x speed) and dive (returns to dive and holds frame one static):
		"animations": {
			"fly": [0, 2, "fly", 0.21],
			"dive": [1, 1, "dive", 1]
		}
	});
	console.log('...and release the bird in the sky');
	bird = new createjs.Sprite(data, "fly");

	startX = (w / 2) - (92 / 2) - 100
	startY = (h / 2) - (92 / 2)
	wiggleDelta = 18

	console.log('Bird postion Y: ' + startY + ' and X: ' + startX);
	bird.setTransform(startX, startY, 1, 1);
	bird.framerate = 30;
	createjs.Tween.get(bird, {
		loop: true
	}).to({
		y: startY + wiggleDelta
	}, 380, createjs.Ease.sineInOut).to({
		y: startY
	}, 380, createjs.Ease.sineInOut);

	obstacles = new createjs.Container();
	stage.addChild(background)
	stage.addChild(runscreen)
	stage.addChild(obstacles)

	stage.addChild(bird, ground);
	stage.addEventListener("stagemousedown", handleJumpStart);

	console.log('Making counters and text fields...');

	centerText = new createjs.Text(0, "100px 'Flappy Bird'", "#ffffff");
	centerTextOutline = new createjs.Text(0, "100px 'Flappy Bird'", "#000000");
	centerTextOutline.outline = 2
	centerTextOutline.textAlign = 'center'
	centerText.textAlign = 'center'
	centerTextOutline.x = w / 2
	centerTextOutline.y = 150
	centerText.x = w / 2
	centerText.y = 150
	centerText.alpha = 1
	centerTextOutline.alpha = 1
	stage.addChild(centerText, centerTextOutline);

	centerText.text = 'Flappy Bird';
	centerTextOutline.text = 'Flappy Bird';
	
	counterText = new createjs.Text(0, "75px 'Flappy Bird'", "#ffffff");
	counterTextOutline = new createjs.Text(0, "75px 'Flappy Bird'", "#000000");
	counterTextOutline.outline = 2
	counterTextOutline.textAlign = 'left'
	counterText.textAlign = 'left'
	counterTextOutline.x = 50
	counterTextOutline.y = 50
	counterText.x = 50
	counterText.y = 50
	counterText.alpha = 0
	counterTextOutline.alpha = 0
	stage.addChild(counterText, counterTextOutline);

	counterText.text = 'Score:';
	counterTextOutline.text = 'Score:';

	counter = new createjs.Text(0, "75px 'Flappy Bird'", "#ffffff");
	counterOutline = new createjs.Text(0, "75px 'Flappy Bird'", "#000000");
	counterOutline.outline = 2
	counterOutline.textAlign = 'left'
	counter.textAlign = 'left'
	counterOutline.x = 320
	counterOutline.y = 50
	counter.x = 320
	counter.y = 50
	counter.alpha = 0
	counterOutline.alpha = 0
	stage.addChild(counter, counterOutline);
	
	BestScoreCounterText = new createjs.Text(0, "50px 'Flappy Bird'", "#ffffff");
	BestScoreCounterTextOutline = new createjs.Text(0, "50px 'Flappy Bird'", "#000000");
	BestScoreCounterTextOutline.outline = 2
	BestScoreCounterTextOutline.textAlign = 'left'
	BestScoreCounterText.textAlign = 'left'
	BestScoreCounterTextOutline.x = 50
	BestScoreCounterTextOutline.y = 130
	BestScoreCounterText.x = 50
	BestScoreCounterText.y = 130
	BestScoreCounterText.alpha = 0
	BestScoreCounterTextOutline.alpha = 0
	stage.addChild(BestScoreCounterText, BestScoreCounterTextOutline);
	BestScoreCounterText.text = 'Best:'
	BestScoreCounterTextOutline.text = 'Best:'
	
	BestScoreCounter = new createjs.Text(0, "50px 'Flappy Bird'", "#ffffff");
	BestScoreCounterOutline = new createjs.Text(0, "50px 'Flappy Bird'", "#000000");
	BestScoreCounterOutline.outline = 2
	BestScoreCounterOutline.textAlign = 'left'
	BestScoreCounter.textAlign = 'left'
	BestScoreCounterOutline.x = 200
	BestScoreCounterOutline.y = 130
	BestScoreCounter.x = 200
	BestScoreCounter.y = 130
	BestScoreCounter.alpha = 0
	BestScoreCounterOutline.alpha = 0
	stage.addChild(BestScoreCounter, BestScoreCounterOutline);
	BestScoreCounter.text = USERLEVEL
	BestScoreCounterOutline.text = USERLEVEL

	console.log('Running engine...');
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.addEventListener("tick", tick);
}

function handleKeyDown(e) {
	console.log('User had pressed button #' + e.keyCode);
	if (!e) {
		var e = window.event;
	}
	switch (e.keyCode) {
		default: handleJumpStart()
	}
}

function handleJumpStart() {
	if (!dead) {
		console.log('Jump!');
		createjs.Tween.removeTweens(bird)
		bird.gotoAndPlay("jump");
		startJump = true
		if (!started) {
			console.info('Game started!');
			started = true
			counterShow = true
			createjs.Tween.get(runscreen).to({
				alpha: 0
			}, 110)
			createjs.Tween.get(centerText).to({
				alpha: 0
			}, 110)
			createjs.Tween.get(centerTextOutline).to({
				alpha: 0
			}, 110)
		}
	} else {
		console.log('Some click...');
	}
}

function diveBird() {
	console.log('Dive bird to the ground...');
	bird.gotoAndPlay("dive");
}

function restart() {
		createjs.Tween.get(stage).to({
			alpha: 0
		}, 100).to({
			alpha: 1
		}, 100)
	console.log('Alright, restart the game!');
	//hide anything on stage and show the score
	obstacles.removeAllChildren();
	createjs.Tween.get(start).to({
		y: start.y + 10
	}, 50).call(removeStart)
	counter.text = 0
	counterOutline.text = 0
	BestScoreCounter.text = window.USERLEVEL;
	BestScoreCounterOutline.text = window.USERLEVEL;
	BestScoreCounter.alpha = 0
	BestScoreCounterOutline.alpha = 0
	counterTextOutline.alpha = 0
	counterText.alpha = 0
	counterOutline.alpha = 0
	counter.alpha = 0
	centerText.alpha = 1;
	centerTextOutline.alpha = 1;
	counterShow = false
	runscreen.alpha = 1;
	centerText.text = 'Get Ready!';
	centerTextOutline.text = 'Get Ready!';
	obstacleDelay = masterObstacleDelay
	dead = false
	started = false
	startJump = false
	createjs.Tween.removeTweens(bird)
	bird.x = startX
	bird.y = startY
	bird.rotation = 0
	createjs.Tween.get(bird, {
		loop: true
	}).to({
		y: startY + wiggleDelta
	}, 380, createjs.Ease.sineInOut).to({
		y: startY
	}, 380, createjs.Ease.sineInOut);
}

function die() {
	if (GODMODE == 'OFF') {
		dead = true;
		console.log('You have killed a bird!');
		bird.gotoAndPlay("dive");
		
		if((counter.text == BestScoreCounter.text)||(counter.text > BestScoreCounter.text)){
			console.log('You have a new Hightscore!');
			if(SAVEMODE == 'local'){
				console.info('New Hightscore saved to the Local Storage!');
				localStorage.setItem('userlevel',counter.text);
			}
			if(SAVEMODE == 'vk'){
				console.info('New Hightscore saved to VK!');
				
			}
		}
		
		ga('send', 'event', "Flappy Bird", "Score", counter.text, counter.text)
		console.log('Die Event sent to the Google');

		createjs.Tween.removeTweens(bird)
		createjs.Tween.get(bird).wait(0).to({
			y: bird.y + 200,
			rotation: 90
		}, (380) / 1.5, createjs.Ease.linear)
		.call(diveBird)
		.to({
			y: ground.y - 30
		}, (h - (bird.y + 200)) / 1.5, createjs.Ease.linear);
		console.log('Bird dropped to the floor');
		start = new createjs.Bitmap(loader.getResult("start"));
		start.alpha = 0
		start.x = w / 2 - start.image.width / 2
		start.y = h / 2 - start.image.height / 2 - 50
		share = new createjs.Bitmap(loader.getResult("share"));
		share.alpha = 0
		share.x = w / 2 - share.image.width / 2
		share.y = h / 2 - share.image.height / 2 + 50
		stage.addChild(start)
		stage.addChild(share)
		console.log('Created new buttons');

		centerText.text = 'The End!';
		centerTextOutline.text = 'The End!';
		console.log('Center Text changed');
		createjs.Tween.get(centerText).to({
			alpha: 1
		}, 100)
		createjs.Tween.get(centerTextOutline).to({
			alpha: 1
		}, 100)
		createjs.Tween.get(counter).to({
			alpha: 0
		}, 70)
		createjs.Tween.get(BestScoreCounter).to({
			alpha: 0
		}, 70)
		createjs.Tween.get(BestScoreCounterOutline).to({
			alpha: 0
		}, 70)
		createjs.Tween.get(BestScoreCounterText).to({
			alpha: 0
		}, 70)
		createjs.Tween.get(BestScoreCounterTextOutline).to({
			alpha: 0
		}, 70)
		createjs.Tween.get(counterOutline).to({
			alpha: 0
		}, 70)
		createjs.Tween.get(counterText).to({
			alpha: 0
		}, 70)
		createjs.Tween.get(counterTextOutline).to({
			alpha: 0
		}, 70)
		createjs.Tween.get(start).to({
			alpha: 1
		}, 200).call(addClickToStart)
		createjs.Tween.get(share).to({
			alpha: 1
		}, 200).call(addClickToStart)
		console.log('Text & buttons animated');
	}
}

function removeStart() {
	stage.removeChild(start);
	stage.removeChild(share);
	console.log('All control buttons removed!');
}

function addClickToStart() {
	window.addEventListener("keypress", function (event) {
		if (!event) event = window.event;
		if (event.keyCode == KEYCODE_SPACE && dead) {
			console.log('User decided to restart the game via Space Button...');
			restart();
		}
	});
	start.addEventListener("click", restart);
	share.addEventListener("click", goShare);
}

function goShare() {
	console.log('User wants to share his result via Twitter');
	var countText
	if (counter.text == 1) {
		countText = "1 point"
	} else {
		countText = counter.text + " points"
	}
	window.open("https://twitter.com/share?url=http%3A%2F%2Fb1rd.tk&text=I scored " + countText + " on Flappy Bird at ");
	console.log('Result shared!');
}

function tick(event) {
	var deltaS = event.delta / 1000;

	var l = obstacles.getNumChildren();

	if (bird.y > (ground.y - 40)) {
		if (!dead) {
			if (GODMODE == 'ON') {
				counter.text = 0;
				counterOutline.text = 0;
				console.warn('Falling to the ground you become mortal and lose all your point');
			} else {
				die()
			}
		}
		if (bird.y > (ground.y - 30)) {
			createjs.Tween.removeTweens(bird)
		}
	}

	if (bird.y < 0 && (GODMODE == 'ON')) {
		counter.text = 0;
		counterOutline.text = 0;
		console.warn('You can not become something more than God! High Forces took all your points as punishment.');
	}

	if (!dead) {
		ground.x = (ground.x - deltaS * 300) % ground.tileW;
		background.x = (background.x - deltaS * 100) % background.tileW;
	} else {
	}
	
	if (started && !dead) {
		
		if (obstacleDelay == 0) {
			obstacle = new createjs.Bitmap(loader.getResult("obstacle"));
			obstacle.x = w
			obstacle.y = (ground.y - gap * 2) * Math.random() + gap * 1.5
			obstacles.addChild(obstacle);
			//createjs.Tween.get(obstacle).to({x:0 - obstacle.image.width}, 5100)

			obstacle2 = new createjs.Bitmap(loader.getResult("obstacle"));
			obstacle2.scaleX = -1
			obstacle2.rotation = 180
			obstacle2.x = obstacle.x //+ obstacle.image.width
			obstacle2.y = obstacle.y - gap
			//createjs.Tween.get(obstacle2).to({x:0 - obstacle.image.width}, 5100)

			obstacles.addChild(obstacle2);
			console.log('New obstacle created!...');
			obstacleDelay = masterObstacleDelay

		} else {
			obstacleDelay = obstacleDelay - 1
		}
		for (var i = 0; i < l; i++) {
			obstacle = obstacles.getChildAt(i);
			if (obstacle) {
				var fu = false;
				if (true) {
					var collision = ndgmr.checkRectCollision(obstacle, bird, 1, true)
					if (collision) {
						if (collision.width > 8 && collision.height > 8) {
							die()
						}
					}
				}
				obstacle.x = (obstacle.x - deltaS * 300);
				if (obstacle.x <= 338 && obstacle.rotation == 0 && obstacle.name != "counted") {
					obstacle.name = "counted";
						counter.text = counter.text + 1
						counterOutline.text = counterOutline.text + 1
						if(BestScoreCounter.text < counter.text){
							BestScoreCounter.text = counter.text
							BestScoreCounterOutline.text = counterOutline.text
							window.USERLEVEL  = counter.text
						}
				}
				if (obstacle.x + obstacle.image.width <= -obstacle.w) {
					obstacles.removeChild(obstacle)
				}
			}
		}
		if (counterShow) {
			counter.alpha = 1
			counterOutline.alpha = 1
			counterText.alpha = 1
			counterTextOutline.alpha = 1
			BestScoreCounter.alpha = 1
			BestScoreCounterOutline.alpha = 1
			BestScoreCounterText.alpha = 1
			BestScoreCounterTextOutline.alpha = 1
			counterShow = false
		}

	}



	if (startJump == true) {
		console.log('Jumping...');
		startJump = false
		bird.framerate = 60;
		bird.gotoAndPlay("fly");
		if (bird.roation < 0) {
			rotationDelta = (-bird.rotation - 20) / 5
		} else {
			rotationDelta = (bird.rotation + 20) / 5
		}
		if (bird.y < -200) {
			bird.y = -200
		}
		createjs
			.Tween
			.get(bird)
			.to({
				y: bird.y - rotationDelta,
				rotation: -20
			}, rotationDelta, createjs.Ease.linear) //rotate to jump position and jump bird
		.to({
			y: bird.y - jumpAmount,
			rotation: -20
		}, jumpTime - rotationDelta, createjs.Ease.quadOut) //rotate to jump position and jump bird
		.to({
			y: bird.y
		}, jumpTime, createjs.Ease.quadIn) //reverse jump for smooth arch
		.to({
			y: bird.y + 200,
			rotation: 90
		}, (380) / 1.5, createjs.Ease.linear) //rotate back
		.call(diveBird) // change bird to diving position
		.to({
			y: ground.y - 30
		}, (h - (bird.y + 200)) / 1.5, createjs.Ease.linear); //drop to the bedrock
	}
	stage.update(event);
}
//main.js
"use strict";
//- GLOBALS 
var version = "1.0.0";
var Title = '1 dimensional neuroevolution '
var loadMsg, loadPct;
const delay = 100;
//document.dispatchEvent(new CustomEvent("eViewChange", {detail: {chgType: "ColorsetChange"}}));\

//BRAIN Structure as follows:  FIXED


const DART_RADIUS = 5;
const HALO_RADIUS = 12;
const NUMTRAILDOTS = 10;

const WORLDSIZE = 4000;

const NUM_SENSORY = 32; //speed + 31 directions
const NUM_ACTION = 2; //  chg heading, chg speed
const SENSITIVITY = 200;
const ACTION_THRESHOLD = 0.8;
const LIFESPAN = 511;

//------------------------------------------   Data Classes
class AppData extends ApplicationData{
	constructor(dataloadedCallback){
		super(dataloadedCallback);
		this.sound = new Audio('images/landerdie.mp4');
		this.worldSize = new Size();
		this.initiateSettings();
		setTimeout(this.completionCallback, delay);	
	}
	initiateSettings(){
		this.settings = {};
		this.settings.weightRange = 8;
		this.settings.biasRange = 2;
		this.settings.mutationRate = 0.03;
		this.settings.poolSize = 1000
		this.settings.sessionSize = 64;
		this.settings.minSpeed = 80;
		this.settings.maxSpeed = 300;
		this.settings.acceleration = 500;
		this.settings.hiddenNodes = 32;
		this.settings.poolUpdateTime = 10;
		this.settings.turnRadius = 300;
		this.settings.sensorThreshold = 1500;
		this.settings.worldSize = 2500;
	}
	adjustSettings(par, val){
		//console.log(par, val);
		if (par == 'spnWeightRange')this.settings.weightRange = val;
		else if (par == 'spnBiasRange')this.settings.biasRange = val;
		else if (par == 'spnMutationRate')this.settings.mutationRate = val;
		else if (par == 'spnPoolSize')this.settings.poolSize = val;
		else if (par == 'spnSessionSize')this.settings.sessionSize= val;
		else if (par == 'spnMinSpeed')this.settings.minSpeed = val;
		else if (par == 'spnMaxSpeed')this.settings.maxSpeed = val;
		else if (par == 'spnHiddenNodes')this.settings.hiddenNodes = val;
		else if (par == 'spnPoolUpdateTime')this.settings.poolUpdateTime = val;
		else if (par == 'spnAcceleration')this.settings.acceleration = val;
		else if (par == 'spnTurnRadius')this.settings.turnRadius = val;
		else if (par == 'spnSensorThreshold')this.settings.sensorThreshold = val;
		else if (par == 'spnWorldSize')this.settings.worldSize = val;
		else console.log('error in adjust Settings', par, val);
	}
	setWorldSizeFromCanvasSize(sz){
		let baseSize = this.settings.worldSize;
		if (sz.w >= sz.h){
			this.worldSize.update(baseSize, Math.round(sz.h/sz.w * baseSize));
		}
		else {
			this.worldSize.update(Math.round(sz.w/sz.h*baseSize), baseSize);
		}
		if (this.instance){
			this.instance.actionBoundaryChange();
		}
		
	}
	//----------------------------------
	createInstance(){
		//console.log('create instance....start here');
		this.instance = new Instance(this.settings);
	}
	startSessions(){
		if (this.instance.sessionRunning)return;
		//console.log('appData.startSessions()');
		this.instance.setupSession();
		this.instance.startSession();
	}
	processTimeUpdate(dT){
		if (!this.instance.sessionRunning)return;
		this.instance.updateAll(dT);
		//console.log(dT);
	}
}
class Instance {
	constructor(settings) {
		this.settings = settings;
		//create a gene vault and then populate it
		this.createGeneVault();
		//setup session details
		this.updateNumber = 0;
		this.updateNumArray = [];
		this.sessionRunning = false;
		this.totalRunTime = 0;
		//arrays to hold the items
		this.aDarts = [];
		this.aRemovedDarts = [];
		//Boundaries - create and setup
		this.aBoundaries = [];
		this.aBoundaries.push(new Boundary(0,0, appData.worldSize.w, 0));
		this.aBoundaries.push(new Boundary(0,appData.worldSize.h, appData.worldSize.w, appData.worldSize.h));
		this.aBoundaries.push(new Boundary(0,0, 0, appData.worldSize.h));
		this.aBoundaries.push(new Boundary(appData.worldSize.w, 0,appData.worldSize.w, appData.worldSize.h));

		//setup the datafields we'll want to display
		this.avgData = [];
		this.lowData = [];
		this.highData = [];
		this.sessionNumArray = [];
		this.averageAge = [];
		this.averageAgeAtDeath = [];
		this.deaths = 0;
		this.totalAge = 0;
		//connect to the display so it has access to darts for display
		wnMain.connect(this.aDarts);
	}
	actionBoundaryChange(){
		this.aBoundaries[0].update(0,0, appData.worldSize.w, 0);
		this.aBoundaries[1].update(0,appData.worldSize.h, appData.worldSize.w, appData.worldSize.h);
		this.aBoundaries[2].update(0,0, 0, appData.worldSize.h);
		this.aBoundaries[3].update(appData.worldSize.w, 0,appData.worldSize.w, appData.worldSize.h);

	}
	createGeneVault(){
		this.geneVault = new GeneticVault();
		this.geneVault.setupFBGenomeSettings(NUM_SENSORY, this.settings.hiddenNodes, NUM_ACTION, this.settings.weightRange, this.settings.biasRange, SIGMOID_ACTIVATION, HYPERBOLIC_ACTIVATION);
		for (let i=0; i<this.settings.poolSize; i++){
			let g = this.geneVault.createFBRandomGenome();
			this.geneVault.add(g);
		}
	}
	setupSession(){
		//populate the session
		for (let i=0; i<this.settings.sessionSize; i++){
			//put in the array
			this.aDarts.push(this.createNewDart());
		}
		//reset session time
		this.updateTimeRemaining = this.settings.poolUpdateTime;
	}
	createNewDart(){
		let genome = this.chooseCandidate(); 
		//randomize location
		let r = Math.random();
		let x, y;
		if (r < 0.25){
			x = 15 + Math.random() * appData.worldSize.w * 0.1;
			y = 15 + Math.random() * appData.worldSize.h * 0.1;
		}
		else if (r<0.5){
			x = appData.worldSize.w - 15 - Math.random() * appData.worldSize.w * 0.1;
			y = 15 + Math.random() * appData.worldSize.h * 0.1;
		}
		else if (r<0.75){
			x = 15 + Math.random() *  appData.worldSize.w * 0.1;
			y = appData.worldSize.h - 15 -  Math.random() *appData.worldSize.h * 0.1;

		}
		else {
			x = appData.worldSize.w - 15 - Math.random() *appData.worldSize.w * 0.1;
			y = appData.worldSize.h - 15 -  Math.random() *appData.worldSize.h * 0.1;
		}
		//create a new dart
		return new Dart(genome, x,y,getRandomIntegerUpTo(360), this.settings.turnRadius, this.aBoundaries, this.settings.minSpeed, this.settings.maxSpeed, this.settings.acceleration, this.settings.hiddenNodes, this.settings.sensorThreshold);
		r.speed = this.settings.minSpeed + Math.random()/2 * (this.settings.maxSpeed - this.settings.minSpeed);
		
	}
	chooseCandidate(){
		let candidate = null;
		let random = Math.random();
		if (random < 0.05){
			candidate = this.geneVault.createFBRandomGenome();
		}
		if (random < 0.5){
			candidate = this.geneVault.getRandom();
		}
		else if (random < 0.7){
			let r2 = Math.random();
			if (r2 < 0.1){
				this.geneVault.selectParentsRandom();
			}
			else if (r2 < 0.9){
				this.geneVault.selectParentsByFitness();
			}
			else {
				this.geneVault.selectFittestParents();
			}
			candidate = this.geneVault.averageFBGenes();
		}
		else {
			let r2 = Math.random();
			if (r2 < 0.1){
				this.geneVault.selectParentsRandom();
			}
			else if (r2 < 0.8){
				this.geneVault.selectParentsByFitness();
			}
			else {
				this.geneVault.selectFittestParents();
			}
			candidate = this.geneVault.selectFBGeneFromParent();
		}

		if (Math.random() < this.settings.mutationRate){
			candidate = this.geneVault.applyFBMutation(candidate);
			//console.log('mutation');
		}

		return candidate;

	}
	startSession(){
		this.sessionRunning = true;
		wnMain.startClock();
	}
	updateAll(dT){

		//update the pool information if needed
		this.updateTimeRemaining -= dT;
		if (this.updateTimeRemaining <=0){
			this.updateTimeRemaining = this.settings.poolUpdateTime;
			this.updateNumber++;
			//get the data
			let data1 = this.geneVault.getPoolFitnessRating();
			this.lowData.push(data1.low);
			this.avgData.push(data1.avg);
			this.highData.push(data1.high);
			this.updateNumArray.push(this.updateNumber);

			let total = 0;
			this.aDarts.forEach(item => total += item.fitnessData.survivalTime);
			this.averageAge.push(total/this.aDarts.length);

			this.averageAgeAtDeath.push(this.totalAge/this.deaths);

			wnMain.updateSessionGraph(this.updateNumArray, this.highData, this.lowData, this.avgData, this.averageAge, this.averageAgeAtDeath);
		}

		//updateTotalRunTime
		this.totalRunTime += dT;
		wnMain.updateRunTime(this.totalRunTime);


		//update each dart
		this.aDarts.forEach(item => item.update(dT));

		//determine if anyone is too old or if they have aged too much
		let removals = [];
		this.aDarts.forEach((item, index) =>{
			if (item.fitnessData.survivalTime > LIFESPAN){
				removals.push(index)
			}
			else if (item.pos.x < item.radius || item.pos.x > appData.worldSize.w - item.radius || item.pos.y < item.radius || item.pos.y > appData.worldSize.h - item.radius){
				removals.push(index);
			}
		});
		//determine collisions and sep occurrences
		for (let i=0; i<this.aDarts.length - 1; i++){
			for (let j=i + 1; j<this.aDarts.length; j++){
				//first determine if they have hit
				let dist = this.aDarts[i].pos.distanceFrom(this.aDarts[j].pos);
				if (dist < this.aDarts[i].radius + this.aDarts[j].radius){
					//collision
					removals.push(i);
					removals.push(j);
				}
			}
		}
		//reduce the array of removals to remove duplicates
		removals.filter((item, index) => removals.indexOf(item) === index);
		//remove the duplicates
		//console.log(removals);
		if (removals.length){
			for (let i = this.aDarts.length - 1; i>=0; i--){
				if (removals.indexOf(i) >= 0){
					this.aRemovedDarts.push(this.aDarts.splice(i,1).pop());
				}
			}
			hitSound();
		}
		//for all remaining darts, update the ray traces with other darts
		for (let i=0; i<this.aDarts.length; i++){
			for (let j=0; j<this.aDarts.length; j++){
				if (i==j)continue;
				this.aDarts[i].scanDart(this.aDarts[j]);
			}
		}
		//each dart updates sensory inputs and thinks
		this.aDarts.forEach((item) => {
			item.think();
			item.fitnessData.range = item.getRange();
		});

		//fill the session
		this.repopulate();
	}
	repopulate(){
		//put dead ones back in the pool
		while (this.aRemovedDarts.length){
			let item = this.aRemovedDarts.pop();
			this.deaths++;
			this.totalAge += item.fitnessData.survivalTime;
			this.determineFitnessAndStore(item);
		}
		//now sort the gene vault and remove the end
		this.geneVault.sortByFitness(this.settings.poolSize);
		//create new ones
		while (this.aDarts.length < this.settings.sessionSize){
			this.aDarts.push(this.createNewDart());
		}
	}
	determineFitnessAndStore(item){	
		let fitness = item.fitnessData.survivalTime + Math.sqrt(item.fitnessData.range) + Math.cbrt(item.fitnessData.distanceTravelled);
		this.geneVault.add(item.genome, fitness);
	}
}
class Dart {
	constructor(genome, x,y,hdg, turnRadius, boundaries, minSpeed, maxSpeed, accel, hiddenNodes, sensorThreshold){
		this.genome = genome;
		this.pos = new Vector2d(x,y);
		this.dir = getVector2dFromHeading(hdg);
		this.aBoundaries = boundaries;
		this.aShellLines = [new Boundary(0,0,0,0), new Boundary(0,0,0,0)];
		this.speed = 0;
		this.heading = hdg;
		this.minSpeed = minSpeed;
		this.maxSpeed = maxSpeed;
		this.acceleration = accel;
		this.turnRadius = turnRadius; //degrees per second
		this.trailDots = [];
		this.sensorThreshold = sensorThreshold;

		this.radius = DART_RADIUS;
		this.haloRadius = HALO_RADIUS;

		//track items for fitness
		this.fitnessData = {};
		this.fitnessData.sepOccurrences = 0;
		this.fitnessData.survivalTime = 0;
		this.fitnessData.distanceTravelled = 0;

		this.fitnessData.minPos = new Vector2d(Infinity, Infinity);
		this.fitnessData.maxPos = new Vector2d(0,0);
		//ray casting
		this.rays = [];
		this.objectDistances = new Array(31).fill(0);
		this.scanPoints = new Array(31);
		
		//field of view will be 150 degrees - 31 rays 5 degrees apart
		for (let i=-75; i<76; i+= 5){
			this.rays.push(new Ray(this.pos, i));
		}
		//give it a brain
		this.brain = new FixedBrain(NUM_SENSORY, hiddenNodes, NUM_ACTION);
		this.brain.wire(genome);
	}
	update(dT){
		//increment survival Time
		this.fitnessData.survivalTime += dT;

		this.radius = DART_RADIUS + Math.round(this.fitnessData.survivalTime/100);
		this.haloRadius = HALO_RADIUS + Math.round(this.fitnessData.survivalTime/100) * 3;

		//Update the heading based on brain actions
		if (this.turnAction < -ACTION_THRESHOLD){this.heading -= this.turnRadius * dT;}
		else if (this.turnAction > ACTION_THRESHOLD){this.heading += this.turnRadius * dT;}
		if (this.heading < 0)this.heading += 360;
		else if (this.heading >=360)this.heading -= 360;
		this.dir.updateFromHeading(this.heading);
		this.rays.forEach(item => item.updateDirection(this.heading));

		//UPDATE the speed based on brain actions
		if (this.speedAction < -ACTION_THRESHOLD){this.speed -= this.acceleration * dT;}
		else if (this.speedAction > ACTION_THRESHOLD){this.speed += this.acceleration * dT;}
		if (this.speed < this.minSpeed)this.speed = this.minSpeed;
		else if (this.speed > this.maxSpeed)this.speed = this.maxSpeed;

		//update position and trail dots
		let distTravelled = this.speed * dT;
		this.fitnessData.distanceTravelled += distTravelled;
		this.trailDots.push(this.pos.createCopy());
		if (this.trailDots.length > NUMTRAILDOTS)this.trailDots.shift();
		this.pos.x += this.dir.x * distTravelled;
		this.pos.y += this.dir.y * distTravelled;

		//update the max and min positions
		if (this.pos.x < this.fitnessData.minPos.x)this.fitnessData.minPos.x = this.pos.x;
		if (this.pos.y < this.fitnessData.minPos.y)this.fitnessData.minPos.y = this.pos.y;
		if (this.pos.x > this.fitnessData.maxPos.x)this.fitnessData.maxPos.x = this.pos.x;
		if (this.pos.y > this.fitnessData.maxPos.y)this.fitnessData.maxPos.y = this.pos.y;


		//put the two lines into the shellPoints array so it can be scanned
		this.aShellLines[0].update(this.pos.x - this.haloRadius, this.pos.y, this.pos.x + this.haloRadius, this.pos.y);
		this.aShellLines[1].update(this.pos.x, this.pos.y - this.haloRadius, this.pos.x, this.pos.y + this.haloRadius);

		//ray cast to determine walls distance
		this.scan(this.aBoundaries);
	}
	scan(boundaries){
		for (let i=0; i<this.rays.length; i++){
			const ray = this.rays[i];
			let closest = null;
			let record = Infinity;
			for (let segment of boundaries){
				const pt = ray.cast(segment);
				if (pt){
					const d = this.pos.distanceFrom(pt);
					if (d < record){
						record = d;
						closest = pt;
					}
				}
			}
			this.objectDistances[i] = record;
			this.scanPoints[i] = closest;
		}
	}
	scanDart(dart){
		for (let i=0; i<this.rays.length; i++){
			const ray = this.rays[i];
			let closest = this.scanPoints[i];
			let record = this.objectDistances[i];
			for (let segment of dart.aShellLines){
				const pt = ray.cast(segment);
				if (pt){
					const d = this.pos.distanceFrom(pt);
					if (d < record){
						record = d;
						closest = pt;
					}
				}
			}
			this.objectDistances[i] = record;
			this.scanPoints[i] = closest;
		}

	}
	think(){
		//update sensor 0 which is speed
		this.brain.sensory[0] = (this.speed - this.minSpeed)/(this.maxSpeed - this.minSpeed);
		for (let i=1; i<this.brain.sensory.length; i++){
			this.brain.sensory[i] = this.getDistanceSensorValue(this.objectDistances[i-1]);
		}
		//get the brain to think and get outputs
		this.brain.think();
		this.turnAction = this.brain.action[0].value;
		this.speedAction = this.brain.action[1].value;

	}
	getDistanceSensorValue(inputVal){
		if (inputVal > this.sensorThreshold) return 0;
		return 1 - inputVal/this.sensorThreshold;
	}
	getRange(){
		return this.fitnessData.minPos.distanceFrom(this.fitnessData.maxPos);
	}
}
class Boundary {
	constructor(x1, y1, x2, y2){
		this.a = new Vector2d(x1, y1);
		this.b = new Vector2d(x2, y2);
	}
	update(x1, y1, x2, y2){
		this.a.update(x1, y1);
		this.b.update(x2, y2);
	}
}
class Ray {
	constructor(pos, headingOffset){
		this.pos = pos;
		this.headingOffset = headingOffset;
		this.dir = new Vector2d();
	}
	updateDirection(hdg){
		let h = hdg + this.headingOffset;
		if (h<0)h+=360;
		if (h>=360)h-=360;
		this.dir.updateFromHeading(h);
	}
	cast(segment) {
		const x1 = segment.a.x;
		const y1 = segment.a.y;
		const x2 = segment.b.x;
		const y2 = segment.b.y;
		const x3 = this.pos.x;
		const y3 = this.pos.y;
		const x4 = this.pos.x + this.dir.x;
		const y4 = this.pos.y + this.dir.y;
		const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
		if (den == 0) {
		  return null;
		}
		const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
		const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
		if (t > 0 && t < 1 && u > 0) {
		  const pt = new Vector2d();
		  pt.x = x1 + t * (x2 - x1);
		  pt.y = y1 + t * (y2 - y1);
		  return pt;
		} 
		else {
		  return null;
		}
	}
}
//------------------------------------------   Program Objects
//------------------------------------------   UI Classes
class AppManager extends ApplicationManager{
	constructor(){
		super();
		this.cv = this.addCanvas('cvWorld').fixLocation(0,0);
		this.createControls();
		this.createDataDisplays();
		this.worldPixelSize = new Size();
		this.createSettingsScreen();
		this.connected = false;
		this.newFrameFunction = this.newFrame.bind(this);
		//create racer icon array
		this.bRunning = false;
		this.bShowInfo = false;
		this.resizeEvent();
	}
	createControls(){
		new ToggleButton('btnToggleRunning', this.getID(), 'toggleon', 'toggleoff', 'Paused').fixLocation(10, 5).fixSize(180, 26).getClickNotifications(this.actionRunningToggle.bind(this));

		new ToggleButton('btnToggleGraphs', this.getID(), 'toggleon', 'toggleoff', 'Toggle Info.').fixLocation(10, 36).fixSize(180, 26).getClickNotifications(this.actionInfoToggle.bind(this));

		this.showScanners = false;
		new Checkbox('chkShowScans', this.getID(), this.actionToggleScanner.bind(this)).fixLocation(200, 5).fixSize(20,20).bgColor(BLACK);
		this.addLabel('lblShowScan', 'Sample Scanning').fixFontSize(14).fontColor(WHITE).fixLocation(225, 5);

		this.showConflictions = false;
		new Checkbox('chkShowConflictions', this.getID(), this.actionToggleConflictions.bind(this)).fixLocation(380, 5).fixSize(20,20).bgColor(BLACK);
		this.addLabel('lblShowConflict', 'Conflicts').fixFontSize(14).fontColor(WHITE).fixLocation(405, 5);

		this.addLabel('lblTotalRunTime', '').fixLocation(10, 60).fixFontSize(14).fontColor(NDARKGREY3);

		this.addLabel('lblMessage', '').fixFontSize(14).fontColor(NLIGHTGREY2).alignRight().hide();

	}
	createDataDisplays(){
		this.fitnessGraph = this.addCO('gphFitness').fixSize(600, 300).hide();
		this.avgAgeGraph = this.addCO('gphAge').fixSize(600, 300).hide();
	}
	createSettingsScreen(){
		this.addCO('bgSettings').border(1,1,1,1,BLACK).bgColor('#000000A0').relativeSize(100,100);
		let s = this.bgSettings.addCO('paneSettings').fixSize(470, 400).fixLocation(this.toolboxWidth, this.outputAreaHeight).border(1,1,1,1,BLACK).borderRadius(12).bgColor(WHITE);

		s.addLabel('lblSettings', 'Configure Instance Settings').relativeWidth(100).fixFontSize(24).bold().fixLocation(0, 5).alignCenter();
		let left = 10;
		let top = 40;
		//-------------  NUMBER of HIDDEN Nodes
		s.addLabel('lblHiddenNodes', '# Hidden Nodes').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnHiddenNodes', s.getID(), 1, 64, 1, appData.settings.hiddenNodes, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  WEIGHT RANGE
		top += 55;
		s.addLabel('lblWeightRange', 'Weight Range').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnWeightRange', s.getID(), 0, 100, 1, appData.settings.weightRange, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  BIAS RANGE
		top += 55;
		s.addLabel('lblBiasRange', 'Bias Range').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnBiasRange', s.getID(), 0,100,1,appData.settings.biasRange, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  MUTATION RATE
		top += 55;
		s.addLabel('lblMutationRate', 'Mutation Rate').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnMutationRate', s.getID(), 0.005, 0.1, 0.005, appData.settings.mutationRate, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  POOL SIZE
		left+=155;
		top = 40;
		s.addLabel('lblPoolSize', 'Pool Size').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnPoolSize', s.getID(), 50, 2000, 50, appData.settings.poolSize, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  SESSION SIZE
		top+=55;
		s.addLabel('lblSessionSize', 'Session Size').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnSessionSize', s.getID(), 0, 100, 1, appData.settings.sessionSize, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140,30).addButtonClass('spin-button');
		//-------------  SESSION DURATION
		top+=55
		s.addLabel('lblSessionDuration', 'Pool Update Time').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnPoolUpdateTime', s.getID(), 10, 300, 1, appData.settings.poolUpdateTime, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  SENSOR THRESHOLD
		top+=55
		s.addLabel('lblSensorThreshold', 'SensorThreshold').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnSensorThreshold', s.getID(), 50, 1600, 50, appData.settings.sensorThreshold, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  MINIMUM SPEED
		left+=155;
		top = 40;
		s.addLabel('lblMinSpeed', 'Minimum Speed u/s').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnMinSpeed', s.getID(), 25, 500, 5, appData.settings.minSpeed, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  MAXIMUM SPEED
		top+=55
		s.addLabel('lblMaxSpeed', 'Maximum Speed u/s').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnMaxSpeed', s.getID(), 50, 2000, 25, appData.settings.maxSpeed, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  ACCELERATION
		top+=55
		s.addLabel('lblAcceleration', 'Acceleration u/s/s').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnAcceleration', s.getID(), 100, 2500, 50, appData.settings.acceleration, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  Turn Radius
		top+=55
		s.addLabel('lblTurn Radius', 'Turn Radius (deg/s)').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnTurnRadius', s.getID(), 10, 720, 10, appData.settings.turnRadius, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');
		//-------------  Turn Radius
		top+=55
		s.addLabel('lblwrldSize', 'World Size').fixFontSize(14).fixLocation(left+2, top).fontColor(BLACK);
		new SpinButton('spnWorldSize', s.getID(), 500, 5000, 100, appData.settings.worldSize, this.widgetAdjustmentHandler.bind(this)).fixLocation(left, top+18).fixSize(140, 30).addButtonClass('spin-button');

		s.addBasicButton('btnLaunchScenario', "Close & Create").addClass('action-button').fixSize(300, 35).fixLocation(85, 350).assignClickHandler(this.actionCloseSettings.bind(this)).fontColor(BLACK).fixFontSize(22);
	}
	resizeEvent(e){
		super.resizeEvent(e);
		this.bgSettings.paneSettings.center();
		this.canvasSize = new Size(this.getWidth(), this.getHeight());
		this.cv.resize(this.canvasSize.w, this.canvasSize.h);
		appData.setWorldSizeFromCanvasSize(this.canvasSize);

		this.lblMessage.fixLocation(this.canvasSize.w - 400, 5);


		//adjust session info location
		this.fitnessGraph.fixLocation(10, this.canvasSize.h - 310);
		this.avgAgeGraph.fixLocation(this.canvasSize.w - 610, this.canvasSize.h - 310);
		this.drawDarts();
	}
	//---------------------------------  SETTINGS/SCENARIO SCREEN ACTIONS
	widgetAdjustmentHandler(a,b){
		appData.adjustSettings(a,b);
	}
	actionCloseSettings(e){
		this.bgSettings.hide();
		appData.createInstance();
		appData.startSessions();
		this.btnToggleRunning.toggleOn();
		this.btnToggleRunning.updateText('Running');
		this.bRunning = true;

		let txt = 'Pool Size: ' + appData.settings.sessionSize + ', Hidden Nodes: ' + appData.settings.hiddenNodes + ", Sensor Threshold: " + appData.settings.sensorThreshold;
		this.lblMessage.updateText(txt);
	}
	actionRunningToggle(){
		this.bRunning = this.btnToggleRunning.getState();
		console.log('bRunning: ' + this.bRunning);
		if (this.bRunning){
			this.btnToggleRunning.updateText('Running');
			this.startClock();
			
		}
		else {
			this.btnToggleRunning.updateText('Paused');
			this.stopClock();
		}

	}
	actionToggleScanner(status){
		this.showScanners = status;
	}
	actionToggleConflictions(status){
		this.showConflictions = status;
	}
	updateRunTime(t){
		let time = Math.round(t);
		if (time < 60){
			this.lblTotalRunTime.updateText('Run Time: ' + time + " sec.")
		}
		else if (time < 3600){
			this.lblTotalRunTime.updateText('Run Time: ' + ROUND(time/60, 1) + "  mins.")
		}
		else {
			this.lblTotalRunTime.updateText('Run Time: ' + ROUND(time/3600, 2) + "   hrs.")
		}
	}
	actionInfoToggle(){
		this.bShowInfo = this.btnToggleGraphs.getState();

		if (this.bShowInfo){
			this.lblMessage.show();
			this.fitnessGraph.show();
			this.avgAgeGraph.show();
		}
		else {
			this.lblMessage.hide();
			this.fitnessGraph.hide();
			this.avgAgeGraph.hide();
		}
	}
	//---------------------------------  Data connection and management
	connect(aDarts){
		this.aDarts = aDarts;
		this.connected = true;
	}
	//---------------------------------  Animation Loop
	startClock(){
		//console.log("START TIMER");
		this.nowTime = new Date().getTime();
		//this.animID = 
		requestAnimationFrame(this.newFrameFunction);
		this.bLoopActive = true;
	}
	newFrame(){
		if (!this.bLoopActive){
			cancelAnimationFrame(this.animID);
			this.animID = null;
			return;
		}
		this.oldTime = this.nowTime;
		this.nowTime = new Date().getTime();
		this.timeGap = (this.nowTime - this.oldTime)/1000; //timegap in seconds

		//do the processing
		appData.processTimeUpdate(this.timeGap);
		this.animID = requestAnimationFrame(this.newFrameFunction);

		//display
		this.drawDarts();

	}
	stopClock(){
		if (!this.bLoopActive){return;}
		//console.log("STOP TIMER");
		cancelAnimationFrame(this.animID);
		this.animID = null;
		this.bLoopActive = false;
	}
	//--------------------------------------------DRAWING
	getCanvasPointFromWorldPoint(wp){
		if (!wp)return;//console.error('wp ', wp);
		let x = wp.x * this.canvasSize.w/appData.worldSize.w;
		let y = wp.y * this.canvasSize.h/appData.worldSize.h;
		return {x: x, y: y}
	}
	getCanvasDistanceFromWorldDistance(d){
		return d * this.canvasSize.w/appData.worldSize.w;
	}
	drawDarts(){
		if (!this.connected)return;
		this.cv.fillCanvas('#202020');

		this.aDarts.forEach((item, index) =>{
			let pt = this.getCanvasPointFromWorldPoint(item.pos);
			let r = this.getCanvasDistanceFromWorldDistance(item.radius);
			this.cv.drawCircle(pt, r, 4, NLIGHTGREY2, BLACK);

			//HALO
			let col = getMedianColor('#006eb0','#FFFFFF',  0, LIFESPAN, Math.round(item.fitnessData.survivalTime));
			let r2 = this.getCanvasDistanceFromWorldDistance(item.haloRadius);
			this.cv.drawCircle(pt, r2, 1, col + '80', col + '80');


			//this.cvUnderlay.fillCanvas('#00000001');
			for (let i=0; i< item.trailDots.length; i++){
				let p = this.getCanvasPointFromWorldPoint(item.trailDots[i]);
				this.cv.drawCircle(p, 1, 1, WHITE);
			}
			//this.cv.drawText(index, 12, WHITE, pt.x - 5, pt.y - 20);

			//draw the scan points
			let cols = ['#FFFFFF18', '#8080FF18'];
			if (this.showScanners && index < 1){
				for (let i=0; i<item.scanPoints.length; i++){
					let p = this.getCanvasPointFromWorldPoint(item.scanPoints[i]);
					if (p){
						this.cv.drawLine(pt.x, pt.y, p.x, p.y, 10, cols[index]);
					}
				}
			}

			if (this.showConflictions){
				for (let i=0; i<item.scanPoints.length; i++){
					let p = this.getCanvasPointFromWorldPoint(item.scanPoints[i]);
					if (p){
						if (item.pos.distanceFrom(item.scanPoints[i]) < SENSITIVITY){
							this.cv.drawLine(pt.x, pt.y, p.x, p.y, 3, '#FF000040');
						}
					}
				}
			}
			
		});

	}
	updateSessionGraph(nSession, hi, lo, avg, avgAge, deathAge){
		if (!this.bShowInfo)return;
		var layout1 = {
			paper_bgcolor: 'rgba(0,0,0,0)',
    		plot_bgcolor: 'rgba(0,0,0,0)',
			width: 600,
			height: 300,
			title: {
				text:'Pool Fitness',
				font: {
				  family: 'Arial',
				  size: 13,
				  color: '#FFFF'
				},
				xref: 'paper',
				x: 0.05,
			},
			xaxis: {
				gridcolor: '#606060',
				gridwidth: 1,
				tickfont: {
					family: 'Arial',
					size: 14,
					color: '#7f7f7f'
				  },
			},
			yaxis: {
				gridcolor: '#606060',
				gridwidth: 1,
				tickfont: {
					family: 'Arial',
					size: 14,
					color: '#7f7f7f'
				  },
				title: {
				  text: 'Fitness',
				  font: {
					family: 'Arial',
					size: 12,
					color: '#7f7f7f'
				  }
				}
			},
			margin: {
				l: 40,
				r: 0,
				b: 20,
				t: 25,
				pad: 4
			},
			legend: {
				font: {
					family: 'Arial',
					size: 12,
					color: '#7f7f7f'
				  }
			}
		}
		var gHigh = {
			x: nSession,
			y: hi,
			type: 'scatter',
			name: 'High'
		};
		var gAvg = {
			x: nSession,
			y: avg,
			type: 'scatter',
			name: 'Avg'
		};
		var gLow = {
			x: nSession,
			y: lo,
			type: 'scatter',
			name: 'Low'
		}; 
		var data1 = [gAvg, gHigh, gLow];
		Plotly.newPlot(this.fitnessGraph.getID(), data1, layout1);

		var layout2 = {
			paper_bgcolor: 'rgba(0,0,0,0)',
    		plot_bgcolor: 'rgba(0,0,0,0)',
			width: 600,
			height: 300,
			title: {
				text:'Average Age (seconds)',
				font: {
				  family: 'Arial',
				  size: 13,
				  color: '#FFFF'
				},
				xref: 'paper',
				x: 0.05,
			},
			xaxis: {
				gridcolor: '#606060',
				gridwidth: 1,
				tickfont: {
					family: 'Arial',
					size: 14,
					color: '#7f7f7f'
				  },
			},
			yaxis: {
				gridcolor: '#606060',
				gridwidth: 1,
				tickfont: {
					family: 'Arial',
					size: 14,
					color: '#7f7f7f'
				  },
				
			},
			margin: {
				l: 40,
				r: 0,
				b: 20,
				t: 25,
				pad: 4
			},
			legend: {
				font: {
					family: 'Arial',
					size: 12,
					color: '#7f7f7f'
				  }
			}
		}
		var gAge = {
			x: nSession,
			y: avgAge,
			type: 'scatter',
			name: 'Pool Age'
		  }; 
		var gAgeDeath = {
			x: nSession,
			y: deathAge,
			type: 'scatter',
			name: 'Age@Death'
		}
		var data2 = [gAge, gAgeDeath];
		Plotly.newPlot(this.avgAgeGraph.getID(), data2, layout2);
	}
}
//-----------------------------------------     START UP and SETUP
window.onload = function () {
	loadMsg = document.getElementById("loadmessage");
	loadPct = document.getElementById("loadpct");
	appData = new AppData(fPrepareToRun);
};
function fPrepareToRun(){
	wnMain = new AppManager();
	fFinalizeAndStart();
}
function fFinalizeAndStart(){
	$("LoadingDiv").parentNode.removeChild($("LoadingDiv"));
	loadMsg = null;
	loadPct = null;
	wnMain.resizeEvent();
	
}	
//-------------------------------------------   MISC HELPERS
function hitSound(){
	//appData.sound.play();
}
function test(){
	for (let i=-180; i<190; i+=10){
		let a = getVector2dFromHeading(i);
		console.log (a.x, a.y);
	}
			
}


 
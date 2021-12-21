/* JRAD NEURO - EVOLUTION ML LIBRARY
Created DEC 2021
*/

const HIDDEN_NEURON = 'Hidden_Neuron';
const ACTION_NEURON = 'Action_Neuron';
const SENSORY_NEURON = 'Sensory_Neuron';
const SIGMOID_ACTIVATION = 0;
const HYPERBOLIC_ACTIVATION = 1;
const ACTIVATORS = [sigmoid = function(t) {return  1/(1+Math.pow(Math.E, -t))}, hyperbolic = function(t){return Math.tanh(t)}];


class Neuron {
	constructor(){
		this.value = null;
		this.active = null; //used in variable networks only
	}
}
class HiddenNeuron extends Neuron {
	constructor(){
		super();
		this.neuronClass = HIDDEN_NEURON;
		this.inputConnections = 0;
		this.inputWeights = [];
		this.bias = 0;
		this.activationFunction = 0;

		//the following not used in fixed brains since network is dense
		this.inputList = [];
	}
}
class ActionNeuron extends Neuron {
	constructor(){
		super();
		this.neuronClass = ACTION_NEURON;
		this.inputConnections = 0;
		this.inputWeights = [];
		this.bias = 0;
		this.activationFunction = 0;

		//the following not used in fixed brains since network is dense
		this.inputList = [];
	}
}
class FixedBrain {
	constructor(numInputs, numHidden, numOutputs){
		this.sensory = new Array(numInputs).fill(0);
		this.hidden = [];
		this.action = [];
		//create the neurons
		for (let i=0; i<numHidden; i++){this.hidden.push(new HiddenNeuron())}
		for (let i=0; i<numOutputs; i++){this.action.push(new ActionNeuron())}
		//create the place to hold the activation functions
	}
	wire(genome){
		//for fixed brain.  Genome structure is a text string.  all sep by commas
		//each section contains the weights, followed by bias, followed by activation function
		//the sections are all the hidden neurons, then the output neurons
		//last piece is a string that is used to describe the genome
		let elements = genome.split(',');
		for (let i=0; i<this.hidden.length; i++){
			for (let j=0; j<this.sensory.length; j++){
				this.hidden[i].inputWeights.push(Number(elements.shift()));
			}
			this.hidden[i].bias = Number(elements.shift());
			this.hidden[i].activationFunction = ACTIVATORS[Number(elements.shift())];
		}
		for (let i=0; i<this.action.length; i++){
			for (let j=0; j<this.hidden.length; j++){
				this.action[i].inputWeights.push(Number(elements.shift()));
			}
			this.action[i].bias = Number(elements.shift());
			this.action[i].activationFunction = ACTIVATORS[Number(elements.shift())];
		}
		this.geneSource = elements.shift();
	}
	think(){
		
		//calculate all the hidden neurons values
		for (let i=0; i<this.hidden.length; i++){
			let sum = this.hidden[i].bias;
			for (let j=0; j<this.sensory.length; j++){
				sum += this.sensory[j] * this.hidden[i].inputWeights[j];
			}
			this.hidden[i].value = this.hidden[i].activationFunction(sum);
		}
		//calculate the values of the output neurons
		for (let i=0; i<this.action.length; i++){
			let sum = this.action[i].bias;
			for (let j=0; j<this.hidden.length; j++){
				sum += this.hidden[j].value * this.action[i].inputWeights[j];
			}
			this.action[i].value = this.action[i].activationFunction(sum);
		}
	}
}
//----------------------------------STORAGE of GENOMES
class GeneticVault {
	constructor(){
		this.vault = [];
		this.parents = {parent1Genome: null, parent2Genome: null};
	}
	setupFBGenomeSettings(numSensory, numHidden, numAction, weightRange, biasRange, defaultHiddenActivation, defaultActionActivation){
		this.genomeSettings = {};
		this.genomeSettings.numSensory = numSensory;
		this.genomeSettings.numHidden = numHidden;
		this.genomeSettings.numAction = numAction;
		this.genomeSettings.weightRange = weightRange;
		this.genomeSettings.biasRange = biasRange;
		this.genomeSettings.defaultHiddenActivation = defaultHiddenActivation;
		this.genomeSettings.defaultActionActivation =  defaultActionActivation;
	}
	add(genome, fitness = 0){
		this.vault.push(new GenomePackage(genome, fitness));
	}
	sortByFitness(limitSize = 0){
		let sorted = false;
		while (!sorted){
			sorted = true;
			for (let i=1; i<this.vault.length; i++){
				if (this.vault[i].fitness > this.vault[i-1].fitness){
					sorted = false;
					[this.vault[i-1], this.vault[i]] = [this.vault[i], this.vault[i-1]]
				}
			}
		}

		if (limitSize){
			while (this.vault.length > limitSize){
				this.vault.pop();
			}
		}
	}
	createFBRandomGenome(){
		let g = '';
		//Add all the weights and bias for sensory to hidden layer
		for (let i=0; i<this.genomeSettings.numHidden; i++){
			for (let j = 0; j<this.genomeSettings.numSensory; j++){
				let x = ROUND(Math.random() * this.genomeSettings.weightRange, 5) - this.genomeSettings.weightRange/2;
				g += x + ',';
			}
			let x = ROUND(Math.random() * this.genomeSettings.biasRange, 5) - this.genomeSettings.biasRange/2;
			g += x + ',';
			g += this.genomeSettings.defaultHiddenActivation + ',';
		}

		//Add all the weights and bias for hidden to action layer
		for (let i=0; i<this.genomeSettings.numAction; i++){
			for (let j = 0; j<this.genomeSettings.numHidden; j++){
				let x = ROUND(Math.random() * this.genomeSettings.weightRange, 5) - this.genomeSettings.weightRange/2;
				g += x + ',';
			}
			let x = ROUND(Math.random() * this.genomeSettings.biasRange, 5) - this.genomeSettings.biasRange/2;
			g += x + ',';
			g += this.genomeSettings.defaultActionActivation + ',';
		}
		
		//Add the gene description
		g += "RandomCreation";
		return g;
	}
	getPoolFitnessRating(){
		let hi = 0;
		let lo = 10000;
		let total = 0;
		this.vault.forEach((item)=>{
			total += item.fitness;
			if (item.fitness > hi)hi = item.fitness;
			if (item.fitness < lo)lo = item.fitness;
		});
		return {low: lo, avg: total/this.vault.length, high: hi}
	}
	//--------------- PARENT SELECTION METHODS
	selectParentsRandom(){
		this.parents.parent1Genome = this.getRandom();
		this.parents.parent2Genome = this.getRandom();
	}
	selectParentsByFitness(){
		this.sortByFitness();
		let filter = getRandomIntegerUpTo(this.vault.length);
		if (filter < 2) filter = 2;
		this.parents.parent1Genome = this.getRandom(filter);
		this.parents.parent2Genome = this.getRandom(filter)
	}
	selectFittestParents(){
		this.sortByFitness();
		let filter = Math.round(this.vault.length * .05);
		if (filter < 2) filter = 2;
		this.parents.parent1Genome = this.getRandom(filter);
		this.parents.parent2Genome = this.getRandom(filter)
	}
	//------------------functions for creating children from the pool
	getRandom(count = this.vault.length){
		let rn = getRandomIntegerUpTo(count);
		//console.log('chose: ' + rn);
		this.vault[rn].fitness *= 0.98;
		return this.vault[rn].genome;
	}
	averageFBGenes(){
		//averages all the weights and biases.  selects activation only from parent 1
		let p1 = this.parents.parent1Genome.split(',');
		let p2 = this.parents.parent2Genome.split(',');

		let g = '';
		//Average all the weights and bias 
		for (let i=0; i<this.genomeSettings.numHidden; i++){
			for (let j = 0; j<this.genomeSettings.numSensory; j++){
				let x = (Number(p1.shift()) + Number(p2.shift()))/2;
				g += x + ',';
			}
			let x = (Number(p1.shift()) + Number(p2.shift()))/2;
			g += x + ',';
			g += p1.shift() + ',';
			p2.shift();
		}

		//Add all the weights and bias for hidden to action layer
		for (let i=0; i<this.genomeSettings.numAction; i++){
			for (let j = 0; j<this.genomeSettings.numHidden; j++){
				let x = (Number(p1.shift()) + Number(p2.shift()))/2;
				g += x + ',';
			}
			let x = (Number(p1.shift()) + Number(p2.shift()))/2;
			g += x + ',';
			g += p1.shift() + ",";
			p2.shift();
		}

		//Add the gene description
		g += "AveragingParents";
		return g;
	}
	selectFBGeneFromParent(){
		let p1 = this.parents.parent1Genome.split(',');
		let p2 = this.parents.parent2Genome.split(',');
		let favored = Math.random();

		let numChunks = this.genomeSettings.numHidden + this.genomeSettings.numAction;
		let chunk1Length = this.genomeSettings.numSensory + 2;
		let chunk2Length = this.genomeSettings.numHidden + 2;

		let g = [];
		for (let i=0; i<numChunks; i++){
			let p = p2;
			let nonP = p1;
			if (Math.random() < favored){
				p = p1;
				nonP = p2
			}
			let tL = chunk2Length;
			if (i<this.genomeSettings.numHidden) tL = chunk1Length;
			for (let j=0; j<tL; j++){
				g.push(p.shift());
				nonP.shift();
			}
		}
		g.push('chosenFromParent');
		return g.join(',');

	}
	applyFBMutation(genome){
		let p = genome.split(',');
		let numChunks = this.genomeSettings.numHidden + this.genomeSettings.numAction;
		let chunkNum = getRandomIntegerUpTo(numChunks);

		if (chunkNum < this.genomeSettings.numHidden){
			let sectionLength = this.genomeSettings.numSensory + 2;
			let startVal = chunkNum * sectionLength;
			let itemVal = getRandomIntegerUpTo(sectionLength - 1);
			let type = this.genomeSettings.weightRange;
			if (itemVal == sectionLength - 2) type == this.genomeSettings.biasRange;
			p[startVal + itemVal] = Math.random() * type - type/2;
		}
		else {
			let sectionLength = this.genomeSettings.numHidden + 2;
			let startVal = (this.genomeSettings.numSensory + 2) * this.genomeSettings.numHidden;
			chunkNum -= this.genomeSettings.numHidden;
			startVal += chunkNum * sectionLength;
			let itemVal = getRandomIntegerUpTo(sectionLength - 1);
			let type = this.genomeSettings.weightRange;
			if (itemVal == sectionLength - 2) type == this.genomeSettings.biasRange;
			p[startVal + itemVal] = Math.random() * type - type/2;
		}
		p[p.length - 1] += "+Mutation";
		let g = p.join(',');
		return g;

	}


}

class GenomePackage {
	constructor(genome, fitness){
		this.genome = genome;
		this.fitness = fitness;//getRandomIntegerUpTo(100);
	}
}


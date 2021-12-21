const jradInterfaces_version = '0.1.1';
class ServerInterface {
    constructor(){
        this.currentResponse = "";
    }
    sendRequest(data, callback){
        this.completionCallback = callback;
        let handleResponse = this.receiveData.bind(this);
        var xhr = new XMLHttpRequest();
		xhr.open("POST", '', true);
		xhr.setRequestHeader('Content-Type', 'application/text');
		xhr.send(data);
		xhr.onload =  function() {handleResponse(this.responseText);};
    }

    receiveData(response){
		let resp = "NO RESPONSE";
		try {resp = response;}
		catch (e){alert ("ERROR: " + response);}
		this.currentResponse = resp;
		this.completionCallback(resp);
	}
}
//-------------------------------------      PHP File Management
class phpFileInterface{
	constructor(phpURL, basePath){
        //interface for php file handling 
		this.currentResponse = "";
		this.phpUrl = phpURL;
        this.basePath = basePath;
	}
    test(callback){
		this.completionCallback = callback;
        let jsonData = JSON.stringify({filename: "", action: "TEST", detail: ""});
        this.sendPHPRequest(jsonData);
    }
    getFileList(path, callback){
		this.completionCallback = callback;
        let jsonData = JSON.stringify({filename: "", action: "GET_DIR_CONTENTS", detail: this.basePath + path});
        this.sendPHPRequest(jsonData);
    }
    sendPHPRequest(jsonData){
        let handleResponse = this.receiveData.bind(this);
        var xhr = new XMLHttpRequest();
		xhr.open("POST", this.phpUrl, true);
		xhr.setRequestHeader('Content-Type', 'application/text');
		xhr.send(jsonData);
		xhr.onload =  function() {handleResponse(this.responseText);};
    }
    createFile(file, contents, callback){
        let f = this.basePath + file;
		this.completionCallback = callback;
		let jsonData = JSON.stringify({filename: f, action: "WRITE", detail: contents})
		this.sendPHPRequest(jsonData);
    }
	getTextFileContents(file, callback){
		let fileURL = this.basePath + file;
		this.completionCallback = callback;
		let jsonData = JSON.stringify({filename: fileURL, action: "READ", detail: ""})
		this.sendPHPRequest(jsonData);
	}
	appendTextFileContents(file, data, callback){
		let fileURL = this.basePath + file;
		this.completionCallback = callback;
		let jsonData = JSON.stringify({filename: fileURL, action: "APPEND", detail: data})
		this.sendPHPRequest(jsonData);
	}
	replaceTextFileContents(file, data, callback){
		let fileURL = "../files/" + file;
		this.completionCallback = callback;
		let jsonData = JSON.stringify({filename: fileURL, action: "REPLACEFILE", detail: data})
		this.sendPHPRequest(jsonData);
	}
	receiveData(response){
		let resp = "NO RESPONSE";
		try {resp = response;}
		catch (e){alert ("ERROR: " + response);}
		this.currentResponse = resp;
		this.completionCallback(resp);
	}
}
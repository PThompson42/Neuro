//****************************************//
//Javascript Rapid App development Library
//  jad.js created 2020-04-03
// V1B - 31-OCT-2020
// 1.0.1 incorporated ApplicationData, changed to wnMain
//1.10 added improved php interface with create, append, etc.
//1.1.1 added server interface to communicate with node server
//refactored to jradBase, jradApps, jradWidgets, jradInterfaces 22-SEP-2021 version 0.1.1 for all
const jradBase_version = '0.1.1';
//******************************************//


//contstants
var wnMain = null;
var appData = null;
const XMLNS = "http://www.w3.org/2000/svg";
const EARTH_RADIUS = 3437;
const $ = ident => document.getElementById(ident) && document.getElementById(ident).owner ? document.getElementById(ident).owner:document.getElementById(ident);
//-------------------------------------      APPLICATION OBJECTS     
class AO {
    constructor(id, parent, inputType = "div"){
        this._id = id;
        this._parentId = parent;
        this._type = inputType;
        this._visible = true;
        this._className = "";
        this.action = null;
        //create an html element based on the type of input
        if (inputType.substr(0,3) === "svg"){
            if (!inputType.substr(3)){this._hElement = document.createElementNS(XMLNS, inputType);}
            else {this._hElement = document.createElementNS(XMLNS, inputType.substr(3));}
        }
        else {
            this._hElement = document.createElement(inputType);
        }
        if (parent === "top") {
            this._parent = $("MainWindow");
            this._parent._hElement.appendChild(this._hElement);
            this._parent.hasChildren = true;
            this._parent[this._id] = this;
        }
        else if (parent === "body"){
            this._parent = "body";
            document.body.appendChild(this._hElement);
        }
        else {
            this._parent = $(this._parentId);
            this._parent._hElement.appendChild(this._hElement);
            this._parent.hasChildren = true;
            this._parent[this._id] = this;
            //determine if the parent is a swappable container
            if (this._parent.bContentSwappable){
                this._parent.addToSwapList(this._id);
            }
        }
        this._hElement.id = this._id;
        this._hElement.owner = this;
        this._hElement.style.position = "absolute";
        //set the sizing to be border-box so border width included in size
        this._hElement.style["box-sizing"] = "border-box";
        
        this._x = new ScrnMeasure(this._hElement, "left");
        this._y = new ScrnMeasure(this._hElement, "top");
        this._z = 1;
        this._w = new ScrnMeasure(this._hElement, "width");
        this._h = new ScrnMeasure(this._hElement, "height");
        this.hideOverflow();
        return (this);
    }
    destructor(){
        if (this.parent === "body") {
            document.body.removeChild(this._hElement);
        }
        else {
            this._parent._hElement.removeChild(this._hElement);
        }
    }
    changeID(newName){
        this._id = newName;
        this._hElement.id = newName;
    }
    getID(){
        return this._id;
    }
    getHTMLElement(){
        return this._hElement;
    }
    getParent(){
        return this._parent;
    }
    isVisible(){
        return this._visible;
    }
    //```````````````````````````````````````````````````````````
    registerForResize(){
        document.dispatchEvent(new CustomEvent("RESIZE REGISTRATION", {detail: this._id}));
        return(this);
    }
    addToVerticalStack(){
        if (this._parent.bVerticalStack){
            this._parent.addToVStackList(this._id);
        }
        else {console.log("Trying to stack in a non stackable location: " + this._id);}
        return(this);
    }
    triggerStackResize(){
        this._parent.vStack();
    }
    addAction(val){
        this.action = val;
        return(this);
    }
    addProp(nProp, val){
        this[nProp]  = val;
        return (this);
    }
     //```````````````````````````````````````````````````````````EVENTS
    assignClickHandler(callback){
        this._clickCallback = callback;
        this._hElement.addEventListener("click", this._clickCallback, false);
        return(this);
    }
    assignChangeCallback(callback){
        this._changeCallback = callback;
        this._hElement.addEventListener("change", this._changeCallback);
        return(this);
    }
    ignoreClicks() {
        this.applyStyle("pointer-events", "none");
        return(this);
    }
    listenForDragging(callback){
        this.rMseDown = this.rMouseDown.bind(this);
        this.rMseUp = this.rMouseUp.bind(this);
        this.rMseMove = this.rMouseMove.bind(this);
        this._hElement.addEventListener("mousedown", this.rMseDown);
        this.callback = callback;
    }
    rMouseDown(e){
       this._hElement.addEventListener("mouseup", this.rMseUp);
       this._hElement.addEventListener("mouseout", this.rMseUp);
       this._hElement.addEventListener("mousemove", this.rMseMove);
       this.lastClickPos = new Point(e.clientX, e.clientY);

    }
    rMouseUp(e){
        this._hElement.removeEventListener("mouseup", this.rMseUp);
        this._hElement.removeEventListener("mouseout", this.rMseUp);
        this._hElement.removeEventListener("mousemove", this.rMseMove);
    }
    rMouseMove(e){
        this.callback(e.clientX - this.lastClickPos.x, e.clientY - this.lastClickPos.y);
        this.lastClickPos.update(e.clientX, e.clientY);
    }
    //```````````````````````````````````````````````````````````css classes and styles
    applyStyle(styleAction, value) {
        this._hElement.style[styleAction] = value;
        return(this);
    }
    addClass(className){
        this._hElement.classList.add(className);
        this._className = className; //used if only one class name (or the most recent addition)
        return(this);
    }
    removeClass(className){
        this._hElement.classList.remove(className);
        return(this);
    }
    changeClass(className){
        if (this._className) {this.removeClass(this._className);}
        this.addClass(className);
    }
    //```````````````````````````````````````````````````````````SET location 
    fixLocation(x,y){
        this.fixX(x);
        this.fixY(y);
        return(this);
    }
    fixX(val){
        this._x.set(val, "px");
        return(this);
    }
    fixY(val){
        this._y.set(val, "px");
        return(this);
    }
    relativeLocation(x,y){
        this._x.set(x, "%");
        this._y.set(y, "%");
        return(this);
    }
    relativeX(val){
        this._x.set(val, "%");
        return(this);
    }
    relativeY(val){
        this._y.set(val, "%");
        return(this);
    }
    //```````````````````````````````````````````````````````````GET location 
    getX(){
        if (this._x.getFixed()){return this._x.get();}
    }
    getY(){
        if (this._y.getFixed()){return this._y.get();}
    }
    //```````````````````````````````````````````````````````````SET size
    fixSize(w,h){
        this.fixWidth(w);
        this.fixHeight(h);
        return(this);
    }
    fixWidth(val){
        this._w.set(val, "px");
        return(this);
    }
    fixHeight(val){
        this._h.set(val, "px");
        return(this);
    }
    relativeSize(w,h){
        this._w.set(w, "%");
        this._h.set(h, "%");
        return(this);
    }
    relativeWidth(val){
        this._w.set(val, "%");
        return(this);
    }
    relativeHeight(val){
        this._h.set(val, "%");
        return(this);
    }
    //```````````````````````````````````````````````````````````GET  size
    getWidth(){
        if (this._w.getFixed()){return this._w.get()}
        else {return this._hElement.offsetWidth;}
    }
    getHeight(){
        if (this._h.getFixed()){return this._h.get()}
        else {return this._hElement.offsetHeight;}
    }
    getSize(){
        return new Size(this.getWidth(), this.getHeight());
    }
    //```````````````````````````````````````````````````````````````````Various Sizes
    resize(){
        //console.log("AO Resize Event");
    }
    getParentWidth(){
        return this._parent.getWidth();
    }
    getParentHeight(){
        return this._parent.getHeight();
    }
    fillToParent(){
        this.fixWidth(this.getParentWidth());
        this.fixHeight(this.getParentHeight());
        return this;
    }
    //```````````````````````````````````````````````````````````````````Placement
    centerH(){
        let x = (this._parent.getWidth() - this.getWidth())/2;
        this.fixX(x);
        return(this);
    }
    centerV(){

        let y = (this._parent.getHeight() - this.getHeight())/2;
        this.fixY(y);
        return(this);
    }
    center(){
        this.centerH();
        this.centerV();
        return this;
    }
    alignTop(){
        this.fixY(0);
        return(this);
    }
    alignBottom(){
        this.fixY(this._parent.getHeight() - this.getHeight());
        return(this);
    }
    //```````````````````````````````````````````````````````````         overflow
    hideOverflow(){
        this.applyStyle("overflow", "hidden");
        return(this);
    }
    autoOverflow(){
        this.applyStyle("overflow", "auto");
        return(this);
    }
    //```````````````````````````````````````````````````````````visibility and z-position
    hide() {
        this._visible = false;
        this.applyStyle("display", "none");
        return(this);
    }
    show() {
        this._visible = true;
        this.applyStyle("display", "block");
        return(this);
    }
    setOpacity(opacity){
        this.applyStyle("opacity", opacity);
        return this;
    }
    isVisible(){
        return this._visible;
    }
    toggleVisibility(){
        if (this._visible){this.hide();}
        else {this.show();}
    }
    setZ(zValue) {
        this._z = zValue;
        this.applyStyle("zIndex", zValue);
        return(this);
    }
    hideOverflow(){
        this.applyStyle("overflow", "hidden");
        return(this);
    }
    autoOverflow(){
        this.applyStyle("overflow", "auto");
        return(this);
    }
    //```````````````````````````````````````````````````````````fonts and text
    updateText(captionText){
        if (this._type === "input" || this._type === "textarea"){
            this._hElement.value = captionText;
        }
        else {
            this._hElement.innerHTML =  captionText ;
        }
        return this;
    }
    getText(){
        if (this._type === "input" || this._type==="textarea"){
            return this._hElement.value;
        }
        else {
           return  this._hElement.innerHTML;
        }
        
    }
    updateCaption(captionText){
        this.updateText(captionText);
    }
    fixFontSize(sz){
        this.applyStyle("fontSize", String(sz) + "px");
        return(this);
    }
    relativeFontSize(sz, measure){
        this.applyStyle("fontSize", String(sz) + measure);
        return(this);
    }
    fontColor(color) {
        if (this.type === "spinnerwidget"){
            this._lbl.applyStyle("color", color);
        }
        else {
            this.applyStyle("color", color);
        }
        return(this);
    }
    bold() {
        this.applyStyle("fontWeight", "bold");
        return(this);
    }
    fontNormal() {
        this.applyStyle("fontWeight", "normal");
        return(this);
    }
    italics() {
        this.applyStyle("fontStyle", "italic");
        return(this);
    }
    alignRight(){
        this.applyStyle("textAlign", "right");
        return(this);
    }
    alignLeft(){
        this.applyStyle("textAlign", "left");
        return(this);
    }
    alignCenter(){
        this.applyStyle("textAlign", "center");
        return(this);
    }
    wrap(shouldWrap){
        if (shouldWrap){this.applyStyle("white-space", "normal");}
        else {this.applyStyle("white-space", "nowrap");}
        return(this);
    }
    overflowWrap(){
        this.applyStyle("overflow-wrap", "normal");
        return this;
    }
    //```````````````````````````````````````````````````````````background images
    bgImage(url) {
        this.applyStyle("backgroundImage", "url(" + url + ")");
        return(this)
    }
    bgImageClear(){
        this.applyStyle("backgroundImage", "none");
        return this;
    }
    bgImageCover(){
        this.applyStyle("background-size", "cover");
        return this;
    }
    bgImageNoRepeat(){
        this.applyStyle("background-repeat", "no-repeat");
        return this;
    }
    bgImageContain(){
        this.applyStyle("background-size", "contain");
        return this;
    }
    bgImageCenter(){
        this.applyStyle("background-position", "center");
        return this;
    }
    //```````````````````````````````````````````````````````````colors
    bgColor(color){
        this.applyStyle("backgroundColor", color);
        return(this);
    }
    //```````````````````````````````````````````````````````````borders
    borderStandard(sz){
        this.applyStyle("borderStyle", "solid");
        this.borderWidth(sz);
        this.borderColor("#000000");
        return(this);
    }
    borderNone(){
        this.applyStyle("borderStyle", "none");
        return(this);
    }
    borderColor(color) {
        this.applyStyle("borderColor", color);
        return(this);
    }
    borderWidth(sz) {
        this.applyStyle("borderWidth", String(sz) + "px");
        return(this);
    }
    borderRadius(sz) {
        this.applyStyle("borderRadius", String(sz) + "px");
        return(this);
    }
    borderStyle(style) {
        this.applyStyle("borderStyle", style);
        return(this);
    }
    bottomBorder(color, sz){
        this.borderColor(color);
        this.borderStyle("solid");
        this.applyStyle("border-width", "0px 0px " + String(sz) + "px 0px");
        return(this);
    }
    border(top, right, bottom, left, color){
        this.applyStyle("borderStyle", "solid");
        this.borderColor(color);
        this.applyStyle("border-width", top + "px " + right + "px " + bottom + "px " + left+ "px");
        return this;
    }
     //```````````````````````````````````````````````````````````make input required
     setRequired(){
         this._hElement.setAttribute("required", "");
         this._hElement.required = true;
     }
}
//-------------------------------------      COMPUND OBJECTS     
class CO extends AO{
    constructor(id, parent, type = "div"){
        super(id,parent, type);
        return(this);
    }
    addBasicButton(id, caption){
       return new BasicButton(id, this._id, caption);
    }
    
    addHoldButton(id, delta, callback, caption){
        return new HoldButton(id, this._id, delta, callback, caption);
    }
    addCanvas(id){
       return new Canvas (id, this._id);
    }
    addSVGContainer(id){
        return new SVGContainer (id, this._id)
    }
    addLabel(id, caption){
        return new Label(id, this._id, caption);
    }
    addContainer(id){
        return new Container(id, this._id);
    }
    addCO(id){
        return new CO(id, this._id);
    }
    addInputTextbox(id, caption){
        return new InputText(id, this._id, caption);
    }
    addInputTextarea(id, caption){
        return new InputArea(id, this._id, caption);
    }
    fixPositionAndSize(x,y,w,h){
        this.fixLocation(x,y);
        this.fixSize(w,h);
        return(this);
    } 
}
//-------------------------------------      SVG Elements   
class SO extends AO{
    constructor(id, parent, svgType){
        //types are circle, rect, ellipse, line, polyline, polygon, path
        super(id, parent, svgType);
        this.type = svgType.substr(3);
        this.loc = new Point();
        this.size = new Size();
        if (this.type === "rect"){
            this.sizeRect(50,50);
            this.locate(0,0);
        }
        else if (this.type === "circle"){
            this.locate(0,0);
            this.setRadius(25);
        }
        else if (this.type === "polygon"){
            this.containerID = this._parent._hElement;
            this.points = this._hElement.points;
        }
        return(this);
    }
    locate(Pt,yC = null){
        if (!yC){this.loc.update(Pt.x, Pt.y);}
        else {this.loc.update(Pt, yC); }
        if (this.type === "circle"){
            this._hElement.style.cx = this.loc.x;
            this._hElement.style.cy = this.loc.y;
        }
        else if (this.type = "rect"){
            this._hElement.style.x = this.loc.x - this.size.w/2;
            this._hElement.style.y = this.loc.y - this.size.h/2;
        }
        return(this);
    }
    setRadius(r){
        this.size.update(r,r);
        this._hElement.style.r = r;
        return(this);
    }
    sizeRect(w,h){
        this.size.update(w,h);
        this._hElement.style.width = w;
        this._hElement.style.height = h;
        this.locate(this.loc);
        return(this);
    }
    getExtent(){
        if (this.type === "rect"){
            return this.size.w/2;
        }
        else if (this.type === "circle"){
            return this.size.w;
        }
    }
    fillColor(color){
        this._hElement.style.fill = color;
        return(this);
    }
    strokeColor(color){
        this._hElement.style.stroke = color;
        return(this);
    }
    strokeWidth(width){
        this._hElement.style.strokeWidth = width;
    }
    //-------------POLYGON SPECIFIC
    addPoint(){
        this.points.appendItem(this.containerID.createSVGPoint());
    }
    update(num, x, y){
        this.points[num].x = x;
        this.points[num].y = y;
    }
}
class SVGContainer extends AO{
    constructor(id, parent){
        super(id, parent, "svg");
        return (this);
    }
    clearSVGChildren(){
        while(this._hElement.lastChild) {
            this._hElement.removeChild(this._hElement.lastChild);
        }
    }
    addCircle(id, x,y, radius){
        return new SO(id, this._id, "svgcircle").locate(x,y).setRadius(radius);
    }
    addRectangle(id, x,y,w,h){
        return new SO(id, this._id, "svgrect").locate(x,y).sizeRect(w,h);
    }
    addImage(id, w,h){
        return new SO(id, this._id, "svgimage").locate(10,10).sizeRect(w,h);
    }
}
//--------------------------------------         APPLICATION OBJECTS
class ApplicationData {
    constructor(completionCallback){
        this.completionCallback = completionCallback;
    }
    loadFile(url){
        return new Promise(function(resolve, reject) {
            //Open a new XHR
            var request = new XMLHttpRequest();
            request.open('GET', url);
            // When the request loads, check whether it was successful
            request.onload = function() {
                if (request.status === 200) {
                    // If successful, resolve the promise
                    resolve(request.response);
                } else {
                    // Otherwise, reject the promise
                    //reject(Error(request.status));
                    reject(request.status);
                }
            };
            request.send();
        });
    }
    openFile(url, processor){
    //Promise to load a file...
    //use with openFile(url, fCallback);
    //fCallback(fileContents){ //do something with fileContents}
    this.loadFile(url).then(function(result) {
        processor(result, true);
    },
    function(err) {
        processor(err, false);
    });
    }
    openFileDialog (accept = "") {
        //bText is true if file to be opened and input as text
        var inputElement = document.createElement("input");
        inputElement.type = "file";
        inputElement.accept = accept; // Note Edge does not support this attribute
        inputElement.addEventListener("change", this.fileDialogChanged);
        inputElement.dispatchEvent(new MouseEvent("click"));
    }
    fileDialogChanged(event){
        //console.log(event, event.target, event.target.files);
        let fName = event.target.files[0].name;
        let file = event.target.files[0];
        if (!file) {return;}
        var reader = new FileReader();
        reader.addEventListener("load", () => {document.dispatchEvent(new CustomEvent("FileLoaded", {detail: {sName: fName, data: reader.result}}));})
        reader.readAsText(file);
    }
    download(filename, text) {
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    fileLoadingComplete(){
        this.completionCallback();
    }
    
}    
class ApplicationManager extends CO{
    constructor(){
       super("MainWindow", "body");
       this.fixLocation(0,0).relativeSize(100,100); 
       document.addEventListener("RESIZE REGISTRATION", this.resizeRegistration.bind(this), false);
       this.resizeRegistrationList = [];
       this.clickRegistrationList = [];
       this.mouseMoveRegistrationList = [];
       window.addEventListener("resize", this.resizeEvent.bind(this), true);
       window.addEventListener("orientationchange", this.resizeEvent.bind(this), true);
       
       //set some alias
       this.documentClick = this.docClickEvent.bind(this);
       this.documentMouseMove = this.docMseMveEvent.bind(this);
       //flags
       this.bListeningForClicks = false;
       this.bListeningForMoves = false;
       this.multiPage = false;
    }
    //------------multipage app items
    activateMultipage(navbarSize= 0, navbarLeft = true){
        this.multiPage = true;
        //create a container to hold the pages and a panel to hold the navbar
        this.navbarSize = navbarSize;
        this.navbarLeft = navbarLeft;
        
        this.addCO("pgContainer").fixLocation(0, 0).relativeSize(100,100);
        if (this.navbarLeft){
            this.addCO("navbarHolder").fixWidth(navbarSize).fixLocation(0,0).relativeHeight(100);
        }
        else {
            this.addCO("navbarHolder").fixHeight(navbarSize).fixLocation(0,0).relativeWidth(100);
        }
        
        this.pageList = [];
        this.activePage = 0;
    }
    addPage(pg){
        pg.index = this.pageList.length;
        this.pageList.push(pg);
        pg.hide();
    }
    getActivePage(){
        return this.activePage;
    }
    getPageByIndex(val){
        return this.pageList[val];
    }
    getPageById(id){
        for (let i=0; i<this.pageList.length; i++){
            if (this.pageList[i].getHandle() == id){return i;}
        }
        return -1;
    }
    activatePageByIndex(index){
        this.pageList.forEach(item => item.hide());
        this.activePage = index;
        this.pageList[index].show();
        this.pageList[index].onActivate();
    }
    activatePageByHandle(handle){
        this.activatePageByIndex(this.getPageById(handle));
    }
    //----------------------------------
    addResizeCallback(callback){
        this.resizeCallback = callback;
    }
    resizeRegistration(e){
        this.resizeRegistrationList.push(e.detail);
    }
    resizeEvent(e){
        //if (this.multiPage){this.pgContainer.fixSize(this.getWidth() - this.navbarWidth, this.getHeight());}
        for (let i=0; i<this.resizeRegistrationList.length; i++){
            $(this.resizeRegistrationList[i]).onResize();
        }
        if (this.resizeCallback){
            //console.log("resizeEvent");
            this.resizeCallback(e);
        }
    }
    //Master document - listen and process clicks 
    registerForClicks(callback){
        if (!this.bListeningForClicks){
            this.bListeningForClicks = true;
            document.addEventListener("click", this.documentClick, true);
        }
        this.clickRegistrationList.push(callback);

    }
    deRegisterForClicks(callback){
        for (let i=0; i<this.clickRegistrationList.length; i++){
            let tFunc = this.clickRegistrationList.shift();
            //console.log(callback);
            //console.log(tFunc);
            if (!(tFunc.toString() == callback.toString())){this.clickRegistrationList.push(tFunc);}
        }
        if (!this.clickRegistrationList.length){
            this.bListeningForClicks = false;
            document.removeEventListener("click", this.documentClick, true);
        }
    }
    docClickEvent(e){
        //console.log("CLICK");
        for (let i=0; i<this.clickRegistrationList.length; i++){
            this.clickRegistrationList[i](e);
        }
    }
    //Master document - listen and process mouse move
    docMseMveEvent(e){
        console.log("MOVE");
        for (let i=0; i<this.mouseMoveRegistrationList.length; i++){
            this.mouseMoveRegistrationList[i](e);
        }
    }
    registerForMouseMovement(callback){
        if (!this.bListeningForMoves){
            this.bListeningForMoves = true;
            document.addEventListener("mousemove", this.documentMouseMove, true);
        }
        this.mouseMoveRegistrationList.push(callback);
    }
    deRegisterForMouseMovement(callback){
        for (let i=0; i<this.mouseMoveRegistrationList.length; i++){
            let tFunc = this.mouseMoveRegistrationList.shift();
            if (!(tFunc.toString() == callback.toString())){this.mouseMoveRegistrationList.push(tFunc);}
        }
        if (!this.mouseMoveRegistrationList.length){
            this.bListeningForMoves = false;
            document.removeEventListener("mousemove", this.documentMouseMove, true);
        }
    }
    goFullScreen(){
        var elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    }  
}
class Page extends CO{
    constructor(handle){
        super(handle, "pgContainer");
		this.handle = handle;
        //set it to fill the space
        this.relativeSize(100,100);
        this.fixLocation(0,0);
        this.registerForResize();
    }
    onActivate(){
        //console.log(this.handle + " PAGE.ACTIVATE");
    }
    onResize(){
        //console.log(this.handle + " onResize");
    }
    getHandle(){
        return this.handle;
    }
}
//    ------------------------------------   GEO, MATH
class Geo {
    constructor(Lat, Long = "Empty") {
        if (Lat == undefined){
            this.Lat = 0;
            this.Long = 0;
        }
        else if (Long == "Empty"){
            //determine if of form 45 12 34 -75 45 00 OR 45.25/-75.34
            if (Lat.includes('/')){
                let chunks = Lat.split('/');
                this.Lat = Number(chunks[0]);
                this.Long = Number(chunks[1]);
            }
            else {
                let chunks = Lat.split(' ');
                this.Lat = Number(chunks[0]) + Number(chunks[1])/60 + Number(chunks[2])/3600;
                this.Long = Number(chunks[3]) + Number(chunks[4])/60 + Number(chunks[5])/3600;
            }
        }
        else {
            this.Lat = Lat ;
            this.Long = Long;
        } 
    } 
    update(Lat, Long){
        if (Lat == undefined){
            this.Lat = 0;
            this.Long = 0;
        }
        else if (Long == "Empty"){
            //determine if of form 45 12 34 -75 45 00 OR 45.25/-75.34
            if (Lat.includes(',')){
                let chunks = Lat.split(',');
                this.Lat = Number(chunks[0]);
                this.Long = Number(chunks[1]);
            }
            else {
                let chunks = Lat.split(' ');
                this.Lat = Number(chunks[0]) + Number(chunks[1])/60 + Number(chunks[2])/3600;
                this.Long = Number(chunks[3]) + Number(chunks[4])/60 + Number(chunks[5])/3600;
            }
        }
        else {
            this.Lat = Lat ;
            this.Long = Long;
        } 
    }  
    getDistance (g) {
        var c1, c2;
        c1 = Math.sin(DTOR(this.Lat)) * Math.sin(DTOR(g.Lat));
        c2 = Math.cos(DTOR(this.Lat)) * Math.cos(DTOR(g.Lat)) * Math.cos(DTOR(g.Long - this.Long));
        return (RTOD(Math.acos(c1 + c2)) * 60);
    }
    getBearing(g, variation = 0) {
        var c1, c2, c3, c4, c5, tempBearing, Xlat, Xlong, Ylat, Ylong, Distance;
        Distance = this.getDistance(g);
        Ylong = g.Long;
        Ylat = g.Lat;
        Xlong = this.Long;
        Xlat = this.Lat;
        c1 = Math.sin(DTOR(Ylat));
        c2 = Math.sin(DTOR(Xlat)) * Math.cos(DTOR(Distance / 60));
        c3 = Math.sin(DTOR(Distance / 60)) * Math.cos(DTOR(Xlat));
        c4 = Math.abs((c1 - c2) / c3);
        c5 = (c1 - c2) / c3;
        if (c4 >= 1) c4 = 0.99999;
        tempBearing = RTOD(Math.acos(c4));
        if ((Xlong == Ylong) && (c5 < 0)) tempBearing = 180;
        else if ((Xlong < Ylong) && (c5 > 0)) tempBearing = tempBearing;
        else if ((Xlong < Ylong) && (c5 < 0)) tempBearing = 180 - tempBearing;
        else if ((Xlong > Ylong) && (c5 < 0)) tempBearing = 180 + tempBearing;
        else if ((Xlong > Ylong) && (c5 > 0)) tempBearing = 360 - tempBearing;
        else tempBearing = tempBearing;
        if (tempBearing >= 360) tempBearing = tempBearing - 360;
        if (variation) tempBearing = ConvertToMagnetic(tempBearing, variation);
        return tempBearing;
    }
    getVector() {
        var Phi, Theta;
        //SendMessage ("This:  " + this.Lat + ", " + this.Long);
        Theta = DTOR(this.Long); //note west longitude is negative
        Phi = DTOR(90 - this.Lat);
        return new Vector(EARTH_RADIUS * Math.sin(Phi) * Math.cos(Theta), EARTH_RADIUS * Math.sin(Phi) * Math.sin(Theta), EARTH_RADIUS * Math.cos(Phi));
    }
    getDisplay(Scrn, wMapCentre, fZoom) {
        var mVector;
        var PPM;
        var ScreenCtrX, ScreenCtrY;
        ScreenCtrX = Math.round(Scrn.x / 2);
        ScreenCtrY = Math.round(Scrn.y / 2);
        //SendMessage ("Ctr:  " + wMapCentre.Lat + ", " + wMapCentre.Long);
        PPM = ScreenCtrY / fZoom;  //Pixels Per Mile
        //rotate the centre of the map so it is in the centre of the view plane
        mVector = this.getVector();
        mVector.rotateZ(DTOR(-wMapCentre.Long));
        mVector.rotateY(DTOR(-wMapCentre.Lat));
        this.display =  new Point(Math.round(mVector.y * PPM) + ScreenCtrX, ScreenCtrY - Math.round(mVector.z * PPM));
    }
}
class Vector {
    constructor(x, y, z) {
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
        this.z = z !== undefined ? z : 0;
    }
    update(x,y,z){
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
        this.z = z !== undefined ? z : 0;
    }
    vCopy () {
        return new Vector(this.x, this.y, this.z);
    }
    add (b) {
        return new Vector(this.x + b.x, this.y + b.y, this.z + b.z);
    }
    increment (b) {
        this.x += b.x;
        this.y += b.y;
        this.z += b.z;
    }
    subtract(b) {
        return new Vector(this.x - b.x, this.y - b.y, this.z - b.z);
    }
    decrement(b) {
        this.x -= b.x;
        this.y -= b.y;
        this.z -= b.z;
    }
    multiply (scalar) {
        return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    scale (scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
    }
    invert(b) {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
    }
    length () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    lengthSquared () {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    normalize () {
        var l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        this.x /= l;
        this.y /= l;
        this.z /= l;
    }
    getNorm() {
        var l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        var out = new Vector(0, 0, 0);
        out.x = this.x / l;
        out.y = this.y / l;
        out.z = this.z / l;
        return out;
    }
    cross (b) {
        return new Vector(this.y * b.z - b.y * this.z,
            b.x * this.z - this.x * b.z,
            this.x * b.y - b.x * this.y);
    }
    angleFrom (b) {
        var dot = this.x * b.x + this.y * b.y + this.z * b.z;
        var mod1 = this.x * this.x + this.y * this.y + this.z * this.z;
        var mod2 = b.x * b.x + b.y * b.y + b.z * b.z;
        var mod = Math.sqrt(mod1) * Math.sqrt(mod2);
        if (mod === 0) return null;
        var theta = dot / mod;
        if (theta < -1) return Math.acos(-1);
        if (theta > 1) return Math.acos(1);
        return Math.acos(theta);
    }
    distanceFrom(b) {
        let dx = b.x - this.x, dy = b.y - this.y, dz = b.z - this.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    rotateX(Theta) {
        let tempY = this.y * Math.cos(Theta) - this.z * Math.sin(Theta);
        let tempZ = this.y * Math.sin(Theta) + this.z * Math.cos(Theta);
        this.y = tempY;
        this.z = tempZ;
    }
    rotateY(Theta) {
        let tempX = this.x * Math.cos(Theta) - this.z * Math.sin(Theta);
        let tempZ = this.x * Math.sin(Theta) + this.z * Math.cos(Theta);
        this.x = tempX;
        this.z = tempZ;
    }
    rotateZ(Theta) {
        let tempX = this.x * Math.cos(Theta) - this.y * Math.sin(Theta);
        let tempY = this.x * Math.sin(Theta) + this.y * Math.cos(Theta);
        this.x = tempX;
        this.y = tempY;
    }
    getRotatedX (Theta) {
        return new Vector(this.x, this.y * Math.cos(Theta) - this.z * Math.sin(Theta), this.y * Math.sin(Theta) + this.z * Math.cos(Theta));
    }
    getRotatedY (Theta) {
        return new Vector(this.x * Math.cos(Theta) - this.z * Math.sin(Theta), this.y, this.x * Math.sin(Theta) + this.z * Math.cos(Theta));
    }
    getRotatedZ (Theta) {
        return new Vector(this.x * Math.cos(Theta) - this.y * Math.sin(Theta), this.x * Math.sin(Theta) + this.y * Math.cos(Theta), this.z);
    }
    getGeo() {
        var Phi, Theta, temp;
        var nLat, nLong;
        if (this.z > EARTH_RADIUS) this.z = EARTH_RADIUS;
        Phi = Math.acos(this.z / EARTH_RADIUS);
        nLat = 90 - RTOD(Phi);
        temp = Math.sqrt((this.x * this.x) + (this.y * this.y));
        Theta = Math.acos(this.x / temp);
        nLong = RTOD(Theta);
        if (this.y <= 0) nLong *= -1;
        return new Geo(nLat, nLong);
    }
    NewPositionFromVector (vVector, nDistance) {
        return new Vector(this.x + vVector.x * nDistance, this.y + vVector.y * nDistance, this.z + vVector.z * nDistance);
    }
    VectorFromBearing(Bearing, variation) {
        var pSource = this.getGeo();
        var Theta = DTOR(ConvertToTrue(Bearing, variation));
        //console.log('Theta=' + Theta);
        var pDest = new Geo(pSource.Lat - Math.cos(Theta), pSource.Long - Math.sin(Theta) / Math.cos(DTOR(pSource.Lat)));

        pSource = pSource.getVector();
        pDest = pDest.getVector();
        return pSource.subtract(pDest).getNorm();
    }
    NewPositionFromBearing(Bearing, Distance, variation) {
        var vVector = this.VectorFromBearing(Bearing, variation);
        return this.NewPositionFromVector(vVector, Distance);
    }
    getDisplay(Scrn, wMapCentre, fZoom) {
        var mVector;
        var PPM;
        var ScreenCtrX, ScreenCtrY;
        ScreenCtrX = Math.round(Scrn.x / 2);
        ScreenCtrY = Math.round(Scrn.y / 2);
        //SendMessage ("Ctr:  " + wMapCentre.Lat + ", " + wMapCentre.Long);
        PPM = ScreenCtrY / fZoom;  //Pixels Per Mile
        //rotate the centre of the map so it is in the centre of the view plane
        mVector = this.vCopy();
        mVector.rotateZ(DTOR(-wMapCentre.Long));
        mVector.rotateY(DTOR(-wMapCentre.Lat));
        return new Point(Math.round(mVector.y * PPM) + ScreenCtrX, ScreenCtrY - Math.round(mVector.z * PPM));
    }
}
class Vector2d {
    constructor(x, y) {
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
    }
    createCopy(){
        return new Vector2d(this.x, this.y);
    }
    update(x,y){
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
    }
    add (b) {
        return new Vector2d(this.x + b.x, this.y + b.y);
    }
    increment (b) {
        this.x += b.x;
        this.y += b.y;
        return(this);
    }
    subtract(b) {
        return new Vector2d(this.x - b.x, this.y - b.y);
    }
    decrement(b) {
        this.x -= b.x;
        this.y -= b.y;
        return this;
    }
    multiply (scalar) {
        return new Vector2d(this.x * scalar, this.y * scalar);
    }
    scale (scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return(this);
    }
    invert(b) {
        this.x *= -1;
        this.y *= -1;
    }
    getLength () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    distanceFrom(b){
        let dx = b.x - this.x; 
        let dy = b.y - this.y;
        return Math.sqrt(dx * dx + dy * dy );
    }
    lengthSquared () {
        return this.x * this.x + this.y * this.y;
    }
    normalize () {
        var l = this.getLength();
        this.x /= l;
        this.y /= l;
        return(this);
    }
    getNorm() {
        var l = this.getLength();
        var out = new Vector2d(0, 0);
        out.x = this.x / l;
        out.y = this.y / l;
        return out;
    } 
    rotate(Theta) {
        let tempX = this.x * Math.cos(Theta) - this.y * Math.sin(Theta);
        let tempY = this.x * Math.sin(Theta) + this.y * Math.cos(Theta);
        this.x = tempX;
        this.y = tempY;
    }
    getRotated (Theta) {
        return new Vector2d(this.x * Math.cos(Theta) - this.y * Math.sin(Theta), this.x * Math.sin(Theta) + this.y * Math.cos(Theta));
    }
    updateFromHeading(hdg, bDegrees = true){
        if (bDegrees)hdg = DTOR(hdg);
        this.update(Math.sin(hdg), -Math.cos(hdg));
    }
}
function getVector2dFromHeading(hdg, bDegrees = true){
    if (bDegrees)hdg = DTOR(hdg);
    return new Vector2d(Math.sin(hdg), -Math.cos(hdg));

}
class Point {
    constructor(x,y) {
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
    }
    update(x,y){
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
    }
    getGeo(screenWidth, screenHeight, zoomFactor, pMapCentre){
        var ScreenCtrX = (screenWidth / 2);
        var ScreenCtrY = (screenHeight / 2);
        var PPM = ScreenCtrY / zoomFactor;
        var tY = (this.x - ScreenCtrX) / PPM;
        var tZ = (ScreenCtrY - this.y) / PPM;
        var temp = (EARTH_RADIUS * EARTH_RADIUS) - ((tY * tY) + (tZ * tZ));
        var tX = Math.sqrt(temp);
        var vVector = new Vector(tX, tY, tZ);
        vVector.rotateY(DTOR(pMapCentre.Lat));
        vVector.rotateZ(DTOR(pMapCentre.Long));
        return vVector.getGeo();
    }
    distanceFrom(b){
        let dx = b.x - this.x; 
        let dy = b.y - this.y;
        return Math.sqrt(dx * dx + dy * dy );
    }
}
class Line2d {
    constructor(x1,y1,x2,y2){
        this.start = new Vector2d(x1, y1);
        this.end = new Vector2d(x2, y2);
    }
}
//    -------------------------------------   Supporting classes
class ScrnMeasure{
    constructor(target, type){
        this._val = 0;
        this._type = type;
        this._target = target;
    }
    set(value, measure = "px"){
        this._val = value;
        this._bFixed = false;
        this._measure = measure;
        if (measure === "px"){this._bFixed = true;}
        this._target.style[this._type] =  this._val + this._measure;
    }
    get(){
        return this._val;
    }
    getFixed(){
        if (this._bFixed) {return true;}
        else {return false;}
    }
}
class Size {
    //---------------------------------Size - width and height only
    constructor(w,h) {
        this.w = w !== undefined ? w : 0;
        this.h = h !== undefined ? h : 0;
    }
    getScaled(scale){
        return new Size(this.w * scale, this.h * scale);
    }
    update(w,h){
        this.w = w !== undefined ? w : 0;
        this.h = h !== undefined ? h : 0;
    }
}
class Range {
    constructor (lo, hi) {
        this.update(lo, hi);
    }
    update (lo,hi){
        this.lo = lo !== undefined ? lo : 0;
        this.hi = hi !== undefined ? hi : 0;
        this.delta = this.hi - this.lo;
    }
}
class RangeTranslation {
    constructor(a,b,x,y){
        //can accept either two ranges or four values representing lo/hi for src and result
        if (typeof x === "undefined"){
            this.srcRange = a;
            this.targetRange = b;
        }
        else {
            this.srcRange = new Range(a,b);
            this.targetRange = new Range(x,y);
        }
    }
    updateSourceRange(x,y){
        this.srcRange.update(x,y);
    }
    updateTargetRange(x,y){
        this.targetRange.update(x,y);
    }
    getTranslatedValue(val){
        let alpha = (val - this.srcRange.lo)/this.srcRange.delta;
        return this.targetRange.lo + alpha * this.targetRange.delta;
    }
}
class MultiValue{
    constructor(){
        return(this);
    }
    add(val){
        this.baseVal = val;
        this.modVal = val;
        return(this);
    }
}
//    --------------------------------------   Math & Stats helper functions
const DTOR = Degrees => (Degrees * Math.PI)/180;
const RTOD = Radians => Radians * (180/Math.PI);
const ROUND = (n, numdigits) => Math.round(n * Math.pow(10, numdigits))/Math.pow(10, numdigits);
const HEX = x => {
    x = x.toString(16);
    if (x.length === 3) x = "FF";
    return(x.length ===1) ? '0' + x : x;
}
function MEAN(data){
    let total = 0;
    for (let i=0; i<data.length; i++){total += data[i];}
    return total/data.length;
}
function MSTDEV(data){
    let mean = MEAN(data);
    let pSum = 0;
    for (let i=0; i<data.length; i++){
        pSum += Math.pow((mean - data[i]), 2);
    }
    return {mean: mean, stdev: Math.sqrt(pSum/data.length)}
}
function ConvertToTrue (MagBearing, variation) {
	var TrueBearing = MagBearing - variation;
	if (TrueBearing < 0) TrueBearing += 360;
	if (TrueBearing > 360) TrueBearing -= 360;
	return TrueBearing;
}
function ConvertToMagnetic (TrueBearing, variation) {
    var MagBearing = TrueBearing + variation;
    if (MagBearing < 0) MagBearing += 360;
    if (MagBearing > 360) MagBearing -= 360;
    return MagBearing;
}
function convertDDToDMS(deg){
    var d = parseInt(deg);
    var minfloat  = Math.abs((deg-d) * 60);
    var m = Math.floor(minfloat);
    var secfloat = (minfloat-m)*60;
    var s = Math.round(secfloat);
    d = Math.abs(d);

    if (s==60) {
        m++;
        s=0;
    }
    if (m==60) {
        d++;
        m=0;
    }

    return {
        deg : d,
        min : m,
        sec : s
    };
}
function convertDDToDM(deg){
    var d = parseInt(deg);
    var minfloat  = Math.abs((deg-d) * 60);
    var m = Math.round(minfloat);
    d = Math.abs(d);
    if (m==60) {
        d++;
        m=0;
    }
    return {
        deg : d,
        min : m,
    };
}
//    ----------------------------------------   HELPER FUNCTIONS - MISC
function isMobileDevice() {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};
function getMedianColor(color1, color2, lowVal, highVal, actualVal){
    let ratio = (actualVal - lowVal)/(highVal - lowVal);
    if (actualVal < lowVal){return color1;}
    if (actualVal > highVal){return color2;}
    color1 = color1.substr(1);
    color2 = color2.substr(1);

    let r = Math.ceil(parseInt(color2.substring(0,2), 16) * ratio + parseInt(color1.substring(0,2), 16) * (1-ratio));
    let g = Math.ceil(parseInt(color2.substring(2,4), 16) * ratio + parseInt(color1.substring(2,4), 16) * (1-ratio));
    let b = Math.ceil(parseInt(color2.substring(4,6), 16) * ratio + parseInt(color1.substring(4,6), 16) * (1-ratio));

    if (Number.isNaN(r)) console.log(ratio, actualVal, color1, color2);
    return ("#" + HEX(r) + HEX(g) + HEX(b));

}
function isPointInPoly(poly, pt){
    //Algorithm/function from:
    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].D.y <= pt.y && pt.y < poly[j].D.y) || (poly[j].D.y <= pt.y && pt.y < poly[i].D.y))
        && (pt.x < (poly[j].D.x - poly[i].D.x) * (pt.y - poly[i].D.y) / (poly[j].D.y - poly[i].D.y) + poly[i].D.x)
        && (c = !c);
    return c;
}
function coinflip(){
    if (Math.random() < 0.5){return true;}
    else {return false;}
}
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    // Check x and y for overlap
    if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2){
        return false;
    }
    return true;
}
function UrlExists(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', url, false);
    xhr.send();

    if (xhr.status == "404") {
        return false;
    } else {
        return true;
    }
}
function getRandomIntegerUpTo(val){
	return Math.floor(Math.random() * val);
}
function hex2bin(hex){
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

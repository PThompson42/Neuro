const jradWidgets_version = '0.1.1';
//-------------------------------------      LABELS
class Label extends AO {
    constructor (id, parent, caption){
        super (id, parent, "label");
        this.updateText(caption);
    }
}
class Icon extends AO {
    constructor (id, parent, imageurl, size){
        super (id, parent);
        this.bgImage(imageurl);
        this.fixSize(size, size);
        this.bgImageContain().bgImageNoRepeat();
        return(this);
    }
}
//-------------------------------------     INPUT Text
class InputText extends AO{
    constructor(id, parent, caption = ""){
        super(id, parent, "input");
        this._hElement.type = "text";
        this._type = "input";
        this.updateCaption(caption);
        return(this);
    }
}
class InputEmail extends AO{
    constructor(id, parent, caption = ""){
        super(id, parent, "input");
        this._hElement.type = "email";
        this._type = "input";
        this.fixSize(120,40).fixLocation(0,0);
        this.updateCaption(caption);
        return(this);
    }
}
class InputPwd extends AO{
    constructor(id, parent, caption = ""){
        super(id, parent, "input");
        this._hElement.type = "password";
        this._type = "input";
        this.fixSize(120,40).fixLocation(0,0);
        this.updateCaption(caption);
        return(this);
    }
}
class InputNumber extends AO{
    constructor(id, parent){
        super(id, parent, "input");
        this._hElement.type = "number";
        this._type = "number";
        this.fixSize(120,24).fixLocation(0,0);
        return(this);
    }
    setParms(min, max, step){
        this._hElement.min = min;
        this._hElement.max = max;
        this._hElement.step = step;
        return this;
    }
    setValue(val){
        this._hElement.value = val;
        return(this);
    }
    getValue(){
        return(Number(this._hElement.value));
    }
    listenForChanges(callback){
        this._hElement.addEventListener("change", callback);
        return this;
    }
}
//--------------------------------------   BUTTONS/INPUT Items
class BasicButton extends AO{
    constructor(id, parent, caption = ""){
        super(id, parent, "input");
        this._hElement.type = "button";
        this._type = "input";
        this.updateCaption(caption);
        return(this);
    }
    disable(disableColor = "#808080"){
        this._state = "disabled";
        if (this._clickCallback){this._hElement.removeEventListener("click", this._clickCallback, false);}
        this.bgColor(disableColor);
        return(this);
    }
    enable(){
        if (this._clickCallback){this._hElement.addEventListener("click", this._clickCallback, false);}
        this.bgColor("revert");
        if (this._className){this.changeClass(this._className);}
        return(this);
    }
    
}
class ToggleButton extends BasicButton {
    constructor(id, parent, classNameOn, classNameOff, caption = ""){
        super(id, parent, caption);
        this._hElement.type = "button";
        this._type = "input";
        this._classOn = classNameOn;
        this._classOff = classNameOff;
        this._hElement.classList.add(this._classOff);
        this._className = this._classOff;
        this.updateCaption(caption);
        this._state = "normal";
        this.bOn = false;
        this.bNotifications = false;
        this.assignClickHandler(this.toggle.bind(this));
        return(this);
    }
    getClickNotifications(callback){
        this.bNotifications = true;
        this.notificationCallback = callback;
        return this;
    }
    getState(){
        return (this.bOn);
    }
    toggleOn(){
        this.bOn = true;
        this.changeClass(this._classOn);
        this._className = this._classOn;
    }
    toggleOff(){
        this.bOn = false;
        this.changeClass(this._classOff);
        this._className = this._classOff;
        
    }
    toggle(e){
        if (this.bOn){this.toggleOff();}
        else {this.toggleOn();}
        if (this.bNotifications){this.notificationCallback(this.action, this.bOn);}
        return (this.bOn);
    }

}
class HoldButton extends BasicButton {
    constructor(id, parent, delta, callback, caption = ""){
        super(id, parent, caption);
        this._callback = callback;
        this.deltaVal = delta;
        this.timer = null;
        this.dataName = "";
        this.bPressed = false;
        this._hElement.addEventListener("mousedown", this.buttonDown.bind(this), false);
        this.fButtonEnd = this.buttonEnd.bind(this);
        this.fTimerTick = this.timerTick.bind(this);
        this._timerInterval = 125;
    }
    buttonDown(e){
        this.bPressed = true;
        this._hElement.addEventListener("mouseup", this.fButtonEnd, false);
        this._hElement.addEventListener("mouseleave", this.fButtonEnd, false);
        this.timer = setInterval(this.fTimerTick, this._timerInterval);
        this.actionCallback();
    }
    buttonEnd(e){
        this.bPressed = false;
        window.clearInterval(this.timer);
        this.timer = null;
        this._hElement.removeEventListener("mouseup", this.fButtonEnd, false);
        this._hElement.removeEventListener("mouseleave", this.fButtonEnd, false);
    }
    timerTick(e){
        this.actionCallback();
    }
    assignDataName(dName){
        this.dataName = dName;
        return(this);
    }
    changeDelta(delta){
        this.deltaVal = delta;
    }
    changeInterval(inc){
        this._timerInterval = inc;
    }
    actionCallback(){
        if (this.dataName){
            this._callback({sender: this.dataName, value: this.deltaVal});
        }
        else {
            this._callback({sender: this._id, value: this.deltaVal});
        }  
    }
}
class ProgressBar extends AO{
    constructor (id, parent, min, max, value){
        super (id, parent, "meter");
        this.setMinmax(min, max);
        this.setValue(value);
        return (this);
    }
    setMinmax(min, max){
        this._hElement.min = min;
        this._hElement.max = max;
        return(this);
    }
    setValue(val){
        this._hElement.value = val;
        return(this);
    }
    getValue(){
        return this._hElement.value;
    }
}
class RangeInput extends AO{
    constructor (id, parent, min, max, value){
        super (id, parent, "input");
        this._hElement.type = "range";
        this._type = "input";
        this.setMinmax(min, max);
        this.setValue(value);
        this._hElement.addEventListener("change", this.eventValChanged.bind(this));
        return (this);
    }
    setMinmax(min, max){
        this._hElement.min = min;
        this._hElement.max = max;
        return(this);
    }
    setValue(val){
        this._hElement.value = val;
        return(this);
    }
    getValue(){
        return this._hElement.value;
    }
    setChangeCallback(callback){
        this._changeCallback = callback;
        return(this);
    }
    eventValChanged(e){
        if (this._changeCallback){
            this._changeCallback(this.getValue());
        }
    }
}
class SelectionBox extends AO{
    constructor (id, parent, multiple = false){
        super(id, parent, "select");
        this._type = "select";
        if (multiple){
            this._hElement.multiple = true;
        }
        return (this);
    }
    listenForChanges(callback){
        this._hElement.addEventListener("change", callback);
        return this;
    }
    addOption(value, text) {
        let nwOption = document.createElement("option");
        nwOption.value = value;
        nwOption.innerHTML = text;
        nwOption.Owner = this;
        this._hElement.appendChild(nwOption);
        return this;
    }
    selectOption(index) {
        this._hElement.selectedIndex = index;
    }
    getSelection() {
        if (this._hElement.options.length === 0){return {t: "", v: -1};}
        return {t:  this._hElement.options[ this._hElement.selectedIndex].text, v:  this._hElement.options[ this._hElement.selectedIndex].value}
    }
    clearOptions(){
        while(this._hElement.options.length){
            this._hElement.removeChild(this._hElement.options[0])
        }
    }
}
class LblInput extends CO {
    constructor(id, parent, caption, changeCallback, bVertical = true){
        super(id, parent);
        this.lbl = new Label(id + "_lbl", id, caption);
        this.txt = new InputText(id + "_txt", id, "Test Input Text");
        this.bVertical = bVertical;
        this.relativeHeight = 0.4;
        this.txt._hElement.addEventListener("change", this.txtChange.bind(this));
        this.changeCallback = changeCallback;
        return(this);
    }
    setSize(w,h){
        this.fixSize(w,h);
        this.o_width = w;
        this.o_height = h;
        if (this.bVertical){
            this.lbl.fixSize(w, h*this.relativeHeight).fixLocation(0,0);
            this.txt.fixSize(w - 5, h* (1-this.relativeHeight)).fixLocation(5, h * this.relativeHeight);
            this.lbl.fixFontSize(h*this.relativeHeight - 2).bold();
            this.txt.fixFontSize(h* (1-this.relativeHeight) - 2);
        }
        return(this);
    }
    setRelativeHeight(sz){
        this.relativeHeight = sz;
        this.setSize(this.o_width, this.o_height);
        return(this);
    }
    updateInputBox(text){
        this.txt.updateText(text);
    }
    txtChange(e){
        this.changeCallback(this.getID(), this.txt.getText());
    }
    labelColors(bg, txt){
        this.lbl.bgColor(bg).fontColor(txt);
        return(this);
    }
    textboxColors(bg, txt){
        this.txt.bgColor(bg).fontColor(txt);
        return(this);
    }

}
class RadioButton extends AO{
    constructor(id, parent, collectionName, value){
        super (id, parent, "input");
        this._hElement.type = "radio";
        this._hElement.name = collectionName;
        this._hElement.value = value;
        return(this);
    }
    check(){
        this._hElement.checked = true;
        return(this);
    }
    isChecked(){
        return this._hElement.checked;
    }
}
class Checkbox extends AO {
    constructor(id, parent, chkCallback){
        super (id, parent);
        this.checked = false;
        this.assignClickHandler(this.click.bind(this));
        this.chkCallback = chkCallback;
    }
    click(){
        if (this.checked){
            this.uncheck();
        }
        else {
            this.check();
        }
        this.chkCallback(this.checked, this.action);
    }
    check(){
        this.checked = true;
        this.bgImage("images/check.png").bgImageContain().bgImageNoRepeat();
    }
    uncheck(){
        this.checked = false;
        this.bgImageClear();
    }
    isChecked(){
        return this.checked;
    }
}
class SpinButton extends CO{
    constructor(id, parent, loValue, hiValue, increment, startValue, callback){
        super(id, parent);
        this.id = id;
        this.label = this.addLabel('lbl'+id, startValue);
        this.loValue = loValue;
        this.hiValue = hiValue;
        this.increment = increment;
        this.value = startValue;
        this.callback = callback;
        this.label.fixFontSize(28).alignCenter().bgColor(WHITE).border(1,0,1,0,BLACK);
        this.btnUp = this.addHoldButton('btnUp' + id, increment, this.buttonAction.bind(this), '+');
        this.btnDown = this.addHoldButton('btnDown' + id, -increment, this.buttonAction.bind(this), '-');
        this.btnUp.assignDataName('Control Points');
        this.btnDown.assignDataName('Control Points');
        this.fixSize(120, 32);
        return this;
    }
    fixSize(w,h){
        super.fixSize(w,h);
        this.label.fixSize(w-(h*2), h).fixLocation(h,0);
        this.label.fixFontSize(h-5);
        this.btnDown.fixSize(h, h).fixLocation(0, 0);
        this.btnUp.fixSize(h, h).fixLocation(w-h, 0);
        return(this);
    }
    buttonAction(e){
        this.value += e.value;
        if (this.value < this.loValue)this.value = this.loValue;
        if (this.value > this.hiValue)this.value = this.hiValue;
        this.label.updateText(this.value);
        this.callback(this.id, this.value);
    }
    addButtonClass(cls){
        this.btnUp.addClass(cls);
        this.btnDown.addClass(cls);
        return this;
    }
    updateValue(value){
        this.value = value;
        this.label.updateText(this.value);
    }
}
//--------------------------------------      CANVAS
class Canvas extends AO{
    constructor (id, parent){
        super(id, parent, "canvas");
        this.ctx = this._hElement.getContext("2d");
        return(this);
    }
    clearCanvas(){
        this.ctx.clearRect(0,0,this.getWidth(), this.getHeight());
        return(this);
    }
    fillCanvas(nColor){
        this.ctx.fillStyle = nColor;
        this.ctx.fillRect(0,0,this.getWidth(), this.getHeight());
        return(this);
    }
    resize(w,h){
        this._hElement.width = w;
        this._hElement.height = h;
        return(this);
    }
    drawLine(x1,y1,x2,y2, width, color){
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2,y2);
        this.ctx.stroke();
    }
    drawLinePoints(p1,p2, width, color){
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x,p1.y);
        this.ctx.lineTo(p2.x,p2.y);
        this.ctx.stroke();
    }
    drawClosedPoly(aPoints, lWidth, sColor, fColor){
        this.ctx.lineWidth = lWidth;
        this.ctx.strokeStyle = sColor;
        this.ctx.fillStyle = fColor;
        this.ctx.beginPath();
        this.ctx.moveTo(aPoints[0].x, aPoints[0].y);
        for (let i=1; i<aPoints.length; i++){
            this.ctx.lineTo(aPoints[i].x, aPoints[i].y);
        }
        this.ctx.closePath();
        this.ctx. stroke();
        this.ctx.fill();
    }
    drawPath(aPoints, lWidth, sColor){
        this.ctx.lineWidth = lWidth;
        this.ctx.strokeStyle = sColor;
        this.ctx.beginPath();
        this.ctx.moveTo(aPoints[0].x, aPoints[0].y);
        for (let i=1; i<aPoints.length; i++){
            this.ctx.lineTo(aPoints[i].x, aPoints[i].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }
    drawOpenPath(aPoints, lWidth, sColor){
        this.ctx.lineWidth = lWidth;
        this.ctx.strokeStyle = sColor;
        this.ctx.beginPath();
        this.ctx.moveTo(aPoints[0].x, aPoints[0].y);
        for (let i=1; i<aPoints.length; i++){
            this.ctx.lineTo(aPoints[i].x, aPoints[i].y);
        }
        this.ctx.stroke();
    }
    changeDefaultFont(font){
        this.defaultFont = font;
    }
    drawText(txt, size, color, x,y, bBold = false){
        this.ctx.fillStyle = color;
        let ad = "";
        if (bBold){ad = "bold ";}
        this.ctx.font = ad + String(size) + "px Arial";
        this.ctx.fillText(txt, x,y);
    }
    drawTextNewFont(txt, size, color, font, x,y, bBold = false){
        this.ctx.fillStyle = color;
        let ad = "";
        if (bBold){ad = "bold ";}
        this.ctx.font = ad + String(size) + "px " + font;
        this.ctx.fillText(txt, x,y);
    }
    drawCircle(center, radius, lWidth, strokeColor, fillColor = null){
       this.ctx.beginPath();
        this.ctx.lineWidth = lWidth;
        this.ctx.strokeStyle = strokeColor;
        if (fillColor){this.ctx.fillStyle = fillColor;}
        this.ctx.arc(center.x, center.y, radius, 0, 2*Math.PI);
        //console.log(center.x, center.y, radius, 0, 2*Math.PI);
        this.ctx.stroke();
        if (fillColor){this.ctx.fill();}
    }
    drawRectangle(x,y,w,h,lWidth, strokeColor, fillColor = null){
        this.ctx.beginPath();
        this.ctx.lineWidth = lWidth;
        this.ctx.strokeStyle = strokeColor;
        if (fillColor){this.ctx.fillStyle = fillColor;}
        this.ctx.rect(x,y,w,h);
        //console.log(center.x, center.y, radius, 0, 2*Math.PI);
        this.ctx.stroke();
        if (fillColor){this.ctx.fill();}
    }
    getImgAddress(){
        return this._hElement.toDataURL();
    }
}
//----------------------------------------      VIDEO
class Video extends AO{
    constructor (id, parent){
        super (id, parent, "video");
        this.borderWidth(0);
        return(this);
    }
    setSource(src, type){
        this._hElement.src = src;
        this._hElement.type = type;
        return(this);
    }
    play(){
        this._hElement.play();
        return(this);
    }
    pause(){
        this._hElement.pause();
        return(this);
    }
    resize(w,h){
        this._hElement.width = w;
        this._hElement.height = h;
        return(this);
    }
    toggleControls(){
        this._hElement.controls = !this._hElement.controls;
    }
    unload(){
        this.pause();
        this._hElement.src = "";
        this._hElement.type = "";
        this._hElement.load();
    }
    getDuration(){
        return (this._hElement.duration);
    }
    getCurrentTime(){
        return (this._hElement.currentTime);
    }
    setCurrentTime(amt){
        this._hElement.currentTime = amt;
    }
    incrementCurrentTime(amt){
        this._hElement.currentTime += amt;
    }
    setVolume(amt){
        this._hElement.volume = amt;
    }
    setPlaybackSpeed(amt){
        this._hElement.playbackRate = amt;
    }
    setEndingCallback(callback){
        this._hElement.addEventListener("ended", callback);
    }
}
//--------------------------------------     MENU SYSTEM
class Menu extends CO {
    constructor(id, parent, menubarHeight, itemClass){
        super (id, parent);
        this.aTopMenuItems = [];
        this.menuWindowHeight = menubarHeight;
        this.fixHeight(this.menuWindowHeight);
        this.menuItemClass = itemClass;
        this.applyStyle("overflow", "visible");
        return(this);
    }
    addTopMenuItem(id, caption, width, callback = null){
        //determine position
        let x = 0;
        this.aTopMenuItems.forEach(element => x+= element.getWidth());
        this.aTopMenuItems.push(new TopMenuItem(id, this._id, caption, x, width, this.menuItemClass, this.menuWindowHeight, callback));
    } 
    listenForClicks(){
        wnMain.registerForClicks(this.hideSubs.bind(this));
    }
    hideSubs(){
        for (let i=0; i<this.aTopMenuItems.length; i++){
            if (this.aTopMenuItems[i].bSubmenu){this.aTopMenuItems[i].subMenu.hide();}
        }
        wnMain.deRegisterForClicks(this.hideSubs.bind(this));   
    }

}
class TopMenuItem extends CO {
    constructor (id, parent, caption, xPos, width, style, tHeight, callback) {
        super (id, parent);
        this.clickLevel = "topItem";
        this.fixWidth(width);
        this.fixHeight(tHeight);
        this.fixX(xPos);
        this.addClass(style);
        this.updateText(caption).alignCenter();
        if (callback){
            this.bSubmenu = false;
            this.assignClickHandler(callback);
        }
        else {
            this.bSubmenu = true;
            this.subMenu = new SubMenu(this._id + "_sub", this._id, tHeight, style);
            this.applyStyle("overflow", "visible");
            this.assignClickHandler(this.showSub.bind(this));
        }
    }
    configureSubMenu(aItems, x,y,width, callback) {
        this.subMenu.configure(aItems, x,y,width, callback);
    }
    showSub(e){
        if (e.target.owner.clickLevel){
            this.subMenu.show();
           this.getParent().listenForClicks();
        }
    }
}
class SubMenu extends CO {
    constructor (id, parent, itemHeight, style){
        super(id, parent);
        this.itemHeight = itemHeight;
        this.itemClass = style;
        this.hide();
    }
    configure(aItems, x,y,width, callback){
        this.fixLocation(x,y+1);
        this.fixWidth(width);
        this.fixHeight(this.itemHeight * aItems.length);
        for (let i=0; i<aItems.length; i++){
            new SubMenuItem(this._id + "_" + aItems[i], this._id, aItems[i], i*this.itemHeight, width, this.itemHeight, this.itemClass, callback);
        }
    }

}
class SubMenuItem extends CO {
    constructor(id, parent, caption, y, width, height, style, callback){
        super(id, parent);
        this.fixY(y);
        this.fixSize(width, height);
        this.addClass(style);
        this.updateText(caption);
        this.assignClickHandler(callback);

    }
}
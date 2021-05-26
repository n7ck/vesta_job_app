
master = (function() { 
    //Private Variables:
    // 1. file.Name
    // 2. file.Contents
    // 3. inputObjArr
    var file = { 
        Name: null,         /* String: not including full path */
        Contents: null,     /* JSON Object */
    }
    var inputObjArr = [];
    
    //Private Functions:
    // 4. initialize()
    function initialize(){
    
        //1:initialValuesJSON = JSON.parse( window.localStorage[file.Name]);
        var initialValuesJSON = getInitialValues();

        //2: generate all Input Objects and attach them to DOM:
        for( var i=0; i< file.Contents.length; i++){
            var input = file.Contents[i];

            //input.lastValidValue : try to obtain from initialValuesJSON
            input.lastValidValue = null;
            if( initialValuesJSON && initialValuesJSON[input.entity] ){
                input.lastValidValue = initialValuesJSON[input.entity][input.field];
            }
            if( input.lastValidValue == null){
                input.lastValidValue = ""; //so input fields show empty
            }

            if( isValid(input) ){
                //Generate InputField based on type:
                switch( input.type ){
                    case 'money':  inputObjArr.push( new  MoneyInputObj( input ) ); break;
                    case 'string': inputObjArr.push( new StringInputObj( input ) ); break;
                    case 'date':   inputObjArr.push( new   DateInputObj( input ) ); break;
                }
            }
        }

        //3: Align inputs "Float Left" style :: needed if less than 4 inputs on large screen
        alignGridLeftAlways();

        function getInitialValues() {
            try{
                var rawValues = window.localStorage[file.Name];
                if( rawValues ){
                    return JSON.parse( rawValues );
                }
            } catch( errorEvent ){
                console.error("Unable to read Saved Values from Local Storage for file: " + file.Name );
                console.error(errorEvent);
            }
        }

        function isValid(input) {
            // All Error Checking regarding verifying proper JSON format.
            var fieldsMissing = "";
            if( !input.entity  ){ fieldsMissing += " input.entity"; }
            if( !input.display ){ fieldsMissing += " input.display"; }
            if( !input.field   ){ fieldsMissing += " input.field"; }
            if( !input.type    ){ fieldsMissing += " input.type"; }
            if( fieldsMissing != ""){
                console.error("Ignored input with missing parameters:"+fieldsMissing);
                console.error(input);
                return false;
            }
            else if( input.entity != "Loan" && input.entity != "Borrower"){
                console.error("Ignored input with unkown entity: "+input.entity+". Expecting either 'Loan' or 'Borrower'.");
                console.error(input);
                return false;
            }
            else if( input.type != "string" && input.type != "money" && input.type != "date"){
                console.error("Ignored Input with unknown type: "+input.type+". Expecting either 'string' 'money' or 'date'.");
                console.error(input);
                return false;
            } 
            return true;
        }

        function alignGridLeftAlways(){
            //add invisible 'filler' zero-height elements for css grid 'Float Left' style alignment:
            var borrowerGrid = document.getElementById('BorrowerInputFields');
            var LoanGrid = document.getElementById('LoanInputFields');
            var filler = document.createElement('div');
            filler.classList.add('grid-filler');
            for( var i = 0; i<3; i++){
                borrowerGrid.appendChild( filler.cloneNode(true) );
                LoanGrid.appendChild( filler.cloneNode(true) );
            }
        }
    }

    //Public Methods (3):
    // 5. extract_Config_JSON_from_File()
    // 6. extract_Config_JSON_from_Storage()
    // 7. saveAllData()
    return { 
        extract_Config_JSON_from_File: function(event){

            destroyPreviousInputs();

            function destroyPreviousInputs(){
                inputObjArr.length = 0; 
                document.getElementById('BorrowerInputFields').innerHTML = "";
                document.getElementById('LoanInputFields').innerHTML = "";
            }

            try{
                var chosenFile = event.target.files[0];
                file.Name = chosenFile.name;
                var reader = new FileReader();
                reader.onload = function(event) { // onload: called when readAsText() finished 
                    try{
                        file.Contents = JSON.parse( event.target.result );
                    } catch (errorEvent){
                        console.error('Unable to parse contents of file.');
                        console.error(errorEvent);
                        return;
                    }
                    if( file.Contents.length > 0){
                        saveFile();
                        document.getElementById('fileInputJSON').innerText = file.Name;
                        initialize();
                        //init datePicker:
                        var datePickers = document.querySelectorAll('input[placeholder]');
                        for( ele of datePickers){
                            new Datepicker( ele, { autohide: true } );
                        }
                    } else {
                        console.error('File Input JSON not array, Expecting Array');
                    }
                };

                reader.readAsText( chosenFile ); /* readAsText() */
            } catch (errorEvent){
                console.error('Unable to open and read from file.');
                console.error(errorEvent);
                return;
            }

            function saveFile(){
                try{
                    window.localStorage.Master_File_Name = file.Name;
                    window.localStorage.Master_File_Contents = JSON.stringify( file.Contents );
                } catch (errorEvent){
                    console.error('Unable to save file contents to localStorage.');
                    console.error(errorEvent);
                }
            }
        },
        extract_Config_JSON_from_Storage: function(){
            /* Attempt localStorage JSON Extraction */
            try {
                window.localStorage.testStorage = "Accessable";
                if (window.localStorage.testStorage == "Accessable") {
                    file.Name = window.localStorage.Master_File_Name;
                    var fileDataRaw = window.localStorage.Master_File_Contents;
                    if( fileDataRaw ){
                        try {
                            file.Contents = JSON.parse( fileDataRaw );
                        } catch (errorEvent){
                            console.error('Unable to parse contents of LocalStorage fileDataRaw');
                            console.error(fileDataRaw);
                            console.error(errorEvent);
                            file.Name = null;
                            file.Contents = null;
                        }
                        if( file.Contents.length > 0){
                            document.getElementById('fileInputJSON').innerText = file.Name;
                            initialize();
                        } else {
                            console.error('File Input JSON not array, Expecting Array');
                        }
                    }
                }
            } catch (errorEvent) {
                console.error('LocalStorage is disabled, please enable LocalStorage/Cookies');
                console.error(errorEvent);
            }
        },
        saveAllData: function(){
            // Decided to generate the 'pretendStore' every SAVE, since pretty straight forward using the inputObjArr
            var pretendStore = {
                Loan: {},
                Borrower: {}
            }
            for( inputObj of inputObjArr ){
                var value = inputObj.valid ? inputObj.getValue() : inputObj.lastValidValue;
                if( value == "" && ( inputObj.type == "date" || inputObj.type == "money") ){
                    // Empty saved money inputs should store null, 
                    // Empty saved date inputs should store null, 
                    // Empty saved string inputs should store an empty string ( handled in last 'else' )
                    pretendStore[inputObj.entity][inputObj.field] = null;
                } else if( inputObj.type == "money" ){
                    // Valid ( money ) so save as Integer
                    pretendStore[inputObj.entity][inputObj.field] = parseInt( value );
                } else {
                    // Valid and non-empty ( string or date ) so save value 
                    pretendStore[inputObj.entity][inputObj.field] = value;
                }
            }
            console.log( pretendStore );
            window.localStorage[file.Name] = JSON.stringify( pretendStore );
        }
    }; 
}())

/* 
    3 InputObjects classes with Base Class:
        1. class MoneyInputObj  extends AbstractInputObj
        2. class StringInputObj extends AbstractInputObj
        3. class DateInputObj   extends AbstractInputObj

    Type        this              input                       Possible Values               String              Money               Date
    -----       ----              -----                       --------------------          ------              -----               ----
    String      this.entity     = input.entity              = 'Loan' or 'Borrower'
    String      *               = input.display             =                               "First Name"        "Loan Amount"       "Birth Date"
    String      this.field      = input.field               =                               "firstName"         "loanAmount"        "birthDate"
    String      this.type       = input.type                = 'string' or 'date' or 'money'
    String      *               = domType                   =                               "text"              "tel"               "date"
    String      this.lastValidValue = input.lastValidValue  = < from backing store >        "Nicholas"          "400000"            "2021-05-06"                  
    String      this.unique     = input.entity+inputField   =                               "BorrowerfirstName" "LoanloanAmount"    "BorrowerbirthDate"
    <rectangle> this.domRec     = *                         = < Outer HTML Element >
    <input>     this.domInput   = *                         = < Inner HTML Element >
    Bool        this.valid      = *                         = true/false ( .invalid class )
    Regex       this.regex      = *                         =                               String Only         *                   *
    Number      this.maxValue   = *                         =                               *                   Money only          *
    Number      this.minValue   = *                         =                               *                   Money only          *
    func        this.recheckValidation()
    func        this.validation()
*/
class AbstractInputObj {
    constructor(input, domType) {
        if (this.constructor == AbstractInputObj) {
            throw new Error("Abstract class can't be instantiated.");
        }
        this.entity         = input.entity;
        this.field          = input.field;
        this.type           = input.type;
        this.unique         = input.entity + input.field;
        this.lastValidValue = input.lastValidValue;
        //Generate HTML:
        this.domRec = document.createElement('rectangle');
        this.domRec.innerHTML = 
            "<label for='"+this.unique+"'>"+input.display+"</label>" +
            "<input id='"+this.unique+"' type='"+domType+"' value='"+input.lastValidValue+"'>" +
            "<div class='message'>invalid input</div>";
        this.domInput = this.domRec.querySelector("#"+this.unique);
        //Attach to DOM:
        //                              #LoanInputFields
        //                          #BorrowerInputFields
        document.getElementById(this.entity+"InputFields").appendChild( this.domRec );
        //Event Listeners ( bind this ):
        this.domInput.addEventListener('input',this.recheckValidation.bind(this));
        this.domInput.addEventListener('blur',this.validation.bind(this));
        this.domInput.addEventListener('blur',function(){this.domRec.classList.remove('focus'); }.bind(this) );//remove .focus
        this.domInput.addEventListener('focus',function(){ this.domRec.classList.add('focus'); }.bind(this) ); //   add .focus
        // this.valid ( two-way data binding - override get / set ):
        Object.defineProperty(this, "valid", {
            set: function(isTrue) {
                if( isTrue ){
                    this.domRec.classList.remove('invalid');        //1. set to Valid
                    if( this.getValue() != this.lastValidValue){    //2. check if value actually changed, if it did:
                        master.saveAllData();                           //3.    save to Data Store
                        this.lastValidValue = this.getValue();          //4.    update lastValidValue
                    }
                } else {
                    this.domRec.classList.add('invalid');
                }
            },
            get: function(){ 
                return !this.domRec.classList.contains('invalid');
            },
            configurable: false
        });
    } //end constructor

    getValue(){ return this.domInput.value; } // overridden by MoneyInputObj to return Integer

    recheckValidation(event){
        //only call validation to see if invalid state rectified if currently 'invalid'
        if( !this.valid ){ this.validation(event); }
    }
    validation(event) { console.error('This Method is required to be overritten and should never actually get called!'); }
}

class MoneyInputObj extends AbstractInputObj {
    // constructor
    constructor(input){
        // 1st: call parent constructor
        super(input,"tel");
        // 2nd: set: this.minValue / this.maxValue 
        if( input.conditions ){
            var keys = Object.keys( input.conditions );
            for (var key of keys ) {
                if( key == 'maxValue'){
                    this.maxValue = input.conditions.maxValue;
                } else if ( key == 'minValue'){
                    this.minValue = input.conditions.minValue;
                } else {
                    console.error("Ignored Condition: "+ key +". Expecting either 'maxValue' or 'minValue'.");
                }
            }
        }
        // 3rd Keep Money Formated:
        this.priorValue = this.lastValidValue;
        this.domInput.addEventListener('input',this.formatMoney.bind(this));
        this.domInput.addEventListener('click',this.focusMoney.bind(this));
        this.formatMoney();
    }
    
    validation (){ 
        if( this.maxValue && this.getValue() > this.maxValue){
            this.domRec.querySelector('.message').innerText = "Max: $" + ( +this.maxValue ).toLocaleString("en-US");
            this.valid = false;
        } else if ( this.minValue && this.getValue() < this.minValue){
            this.domRec.querySelector('.message').innerText = "Minimum: $" + ( +this.minValue).toLocaleString("en-US");
            this.valid = false;
        } else {
            this.valid = true;
        }
    }

    getValue() { 
        //return Integer ( not String )
        return +this.domInput.value.replace(/[^0-9]/g, "");
    }

    focusMoney(event){
        var selectionStart = this.domInput.selectionStart; // --> Count From Left --> 
        if( this.domInput.value == "$0"){
            this.domInput.selectionEnd = this.domInput.selectionStart = 2; // dont allow cursor Left of '$0'
        } else if ( this.domInput.selectionStart == 0){
            this.domInput.selectionEnd = this.domInput.selectionStart = 1; // dont allow cursor Left of '$'
        }
    }

    formatMoney(event) {
        var valueLength = this.domInput.value.length;
        var selectionStart = this.domInput.selectionStart; // --> Count From Left --> 
        var cursorOffset = valueLength - selectionStart;   // <-- Count From Right <--
        var formatedString = "$" + ( this.getValue() ).toLocaleString("en-US")
        //console.log('cursorOffset:'+cursorOffset+' selectionStart:'+ selectionStart + ' formated:'+formatedString);
        var nochange = ( this.priorValue == this.getValue() );
        this.priorValue = this.getValue();

        //1. format the Money: ( Side Effect of modivying the value: cursor Position moves to far Right )
        if( formatedString == "$0" && isNaN( parseInt( this.domInput.value ) ) ){
            this.domInput.value = ""; 
        } else {
            this.domInput.value = formatedString; 
        }

        //2. Update the cursor Position:
        if( event && nochange && selectionStart > 0 && event.inputType == "deleteContentBackward"){
            //handle very special case: pressing 'delete' when comma to left of cursor: delete nothing, move cursor Left 1 space.
            newPos = selectionStart;
        } else if( formatedString == "$0"){
            newPos = 2;
        } else {
            var newPos = formatedString.length - cursorOffset;
            if( newPos < 1){ 
                newPos = 1;
            }
        }
        this.domInput.selectionEnd = this.domInput.selectionStart = newPos; //correct cursor position!
    }
}
class StringInputObj extends AbstractInputObj {
    constructor(input){
        // 1st: call parent constructor
        super(input,"text");
        // 2nd: set: this.regex
        if( input.conditions ){
            var keys = Object.keys( input.conditions );
            for (var key of keys ) {
                if( key == 'regex'){
                    try{
                        this.regex = new RegExp( input.conditions.regex );
                    } catch ( errorEvent){
                        console.error( "Ignored Regex not valid: "+ input.conditions.regex );
                        console.errog( errorEvent );
                    }
                } else {
                    console.error("Ignored Condition: "+ key +". Expecting only 'regex'.");
                }
            }
        }
        // 3rd: set fixed message:
        this.domRec.querySelector('.message').innerText = "Invalid "+input.display;
    } 

    validation (event){ 
        //console.log('String Validation');
        if( this.regex ){
            this.valid =  this.regex.test( event.target.value );
        } else {
            this.valid = true;
        }
    }
}
class DateInputObj extends AbstractInputObj {
    constructor(input){
        // 1st: save current lastValidValue;
        if( input.lastValidValue ){
            var valueObj = input.lastValidValue;
            //input.lastValidValue = valueObj.year + "-" + valueObj.month + "-" + valueObj.day;
            input.lastValidValue = valueObj.month + "/" + valueObj.day + "/" + valueObj.year;
        }
        // 2nd: call parent constructor
        super(input,"text");
        // 3rd: Restore lastValidValue:
        this.lastValidValue = valueObj;
        // 4th: conditions error checking:
        if( input.conditions ){
            console.error("Ignored Conditions, since no Conditions expected on Date input type");
        }
        // 5th: add placeholder text
        //this.domInput.setAttribute('placeholder',"YYYY-MM-DD");
        this.domInput.setAttribute('placeholder',"MM/DD/YYYY");
    }
    getValue() { 
        if( this.domInput.value.length == 0){
            return null;
        }
        //*/
       var dateArr = this.domInput.value.split('/');
       return { month: dateArr[0], day: dateArr[1], year: dateArr[2] }
       /*/
        var dateArr = this.domInput.value.split('-');
       return { month: dateArr[1], day: dateArr[2], year: dateArr[0] }
       /*/
    }
    validation (){ 
        if(this.getValue() != null ){
            this.valid = true; 
        }
    }
}
// This is a dockerize version of the claims sample from:
// https://github.com/zosconnect/sample-nodejs-clients
// 
// The sample rule handles health insurance claims. The following rules
// are used when processing a claim:
//
//   Drug claim - amount exceeded claim limit of $1000
//   Dental claim - amount exceeded claim limit of $800
//   Medical claim - amount exceeded claim limit of $500 
//

var express = require('express');
var rule = require('node-rules');

var app = express();
const portNum = 8082;

// Display Ready Message if root path was specified
app.get('/', displayReady);

// REST API to Get claim result
app.get('/claim/rule', getClaimResult);

// Assign to server constant so we can handle closing later
const server = app.listen(portNum, displayStarted);

// Handle the termination properly (SIGTERM)
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  console.log('Closing http server.');
  server.close(() => {
    console.log('Http server closed.');
  });
});

//
// This function get the result of claim based on claim type and claim amount
// The following fields are passed as query parameters
//  - claimType
//  - claimAmount
//
function getClaimResult(req, res) {

   var results = { };
   
   // Create a Rule Engine instance
   var R = new rule();

   // Add a rule 
   var claimRule = {
       "condition" : function(R) {
         R.when((this.claimType === 'MEDICAL' && this.claimAmount > 100) ||
                (this.claimType === 'DENTAL' && this.claimAmount > 800) ||
                (this.claimType === 'DRUG' && this.claimAmount > 1000));
       },
       "consequence" : function(R) {
         this.result = false;

         R.stop();
       }
   };
   
   // Register claim rule 
   R.register(claimRule);
   
   // Get the data to be used for rule processing from request parameters
   var claimData = {
      'claimType' : req.query.claimType,
      'claimAmount' : req.query.claimAmount
   };

   //   
   // Callbank function to set response from rule processing
   //
   var setResultDetails = function (result) {

     results['claimType'] = claimData.claimType;
     results['claimAmount'] = claimData.claimAmount;

     if (result.result) {
     	  results['status'] = 'Accepted';
     	  results['reason'] = 'Normal claim';
     }
     else {
     	  results['status'] = 'Rejected';
     	      	  
     	  switch(claimData.claimType) {
     	  	case 'MEDICAL' :
     	  			results['reason'] = 'Amount exceeded $100. Claim require further review.';
     	  			break;
     	  			     	  	
     	  	case 'DENTAL' :
     	  			results['reason'] = 'Amount exceeded $800. Claim require further review.'; 
     	  			break;     	  	
     	  	
     	  	case 'DRUG' :
     	  			results['reason'] = 'Amount exceeded $1000. Claim require further review.'; 
     	  			break;
     	  }      
     }
    
     res.status(200).send(results);
   }
   
   // Process the rules using the data passed by caller
   R.execute(claimData, setResultDetails);
}

function displayReady(req, res) {

    res.write("===================================================\n");
    res.write("= Node.js sample application on Docker container  =\n");
    res.write("===================================================\n");
    res.write("=  ****** **       ***   ****** **    ** ******   =\n");
    res.write("=  **     **      ** **    **   ***  *** **       =\n");
    res.write("=  **     **     *******   **   ** ** **  ****    =\n");
    res.write("=  **     **     **   **   **   **    **     **   =\n");
    res.write("=  ****** ****** **   ** ****** **    ** ******   =\n");
    res.write("===================================================\n");
    res.end();
}

function displayStarted() {
  console.log('Node.js application started and listening on local port ' + portNum);
}

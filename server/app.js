var pollingTaskID;

if ( Tokens.find().count() === 0 ){

    Tokens.upsert(
        {account: Meteor.settings.account}, //selector
        { $set:
            {
                account: Meteor.settings.account,
                authCode: '',
                accessToken: '',
                refreshToken: ''
            }
        }
    );    
}

//atob() function to decode base64 is only available on the client.
//use the Base64 package and use .decode() but that returns a Uint8Array
//so use this function to convert Uint8Array to string
function uintToString(uintArray) {
    var encodedString = String.fromCharCode.apply(null, uintArray),
        decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
}

Meteor.methods({
    
    exchangeCodeForTokens: function (code) {
        console.log("exchangeCodeForTokens...");        
        this.unblock();
        var apiUrl = "https://www.googleapis.com/oauth2/v3/token";
        try 
        {        
            var result = HTTP.post( apiUrl,
                {
                params: {                                        
                    'code': code,
                    'client_id': Meteor.settings.public.client_id,
                    'client_secret': Meteor.settings.client_secret,
                    'redirect_uri': Meteor.settings.public.redirect_uri,
                    'grant_type': 'authorization_code'
                }
            });            
            Tokens.upsert(
                {account: Meteor.settings.account},
                { $set:
                    {                        
                        accessToken: result.data.access_token,
                        expiresIn: result.data.expires_in
                        
                    }
                }
            );
            if (result.data.refresh_token) {
                Tokens.upsert(
                    {account: Meteor.settings.account},
                    { $set:
                        {                        
                            refreshToken: result.data.refresh_token
                        }
                    }
                );                
            }
            return result;
            
        } catch(error){
            console.log(error)
            return error;
        }        
    },
    
    exchangeRefreshToken: function(){
        console.log("in exchangeRefreshToken...");        
        this.unblock();            
        var tokens = Tokens.findOne();            
        console.log(tokens.refreshToken);
        var apiUrl = "https://www.googleapis.com/oauth2/v3/token";
        var result = HTTP.post( apiUrl, {
            params: {
                'client_id': Meteor.settings.public.client_id,
                'client_secret': Meteor.settings.client_secret,
                'refresh_token': tokens.refreshToken,
                'grant_type': 'refresh_token'
            }
        });
        
        if (result.data.access_token){
            Tokens.upsert(
                {account: Meteor.settings.account},
                    { $set:
                        {                        
                            accessToken: result.data.access_token,
                            expiresIn: result.data.expires_in
                        }
                    }                
            );            
        }
        return result.data;
    },
    
    listThreads: function(query){
        console.log("in listThreads...");
        console.log(query);
        this.unblock();            
        var tokens = Tokens.findOne();            
        var apiUrl = "https://www.googleapis.com/gmail/v1/users/me/threads?q=" + query;
        try {
            var result = HTTP.get( apiUrl, {
                params: {
                    'access_token': tokens.accessToken
                }
            });
            return result.data;
        } catch(error){
            if (error.response && error.response.statusCode == 401){
                console.log("error.response.statusCode:" + error.response.statusCode);
                //try to refresh
                Meteor.call("exchangeRefreshToken");
                tokens = Tokens.findOne();
                //retry the call
                result = HTTP.get( apiUrl, {
                    params: {
                        'access_token': tokens.accessToken
                    }
                });
                return result.data;
            } else {
                throw new Meteor.Error(400, error.message);
            }                        
        }
    },
    
    listMessages: function(query){
        console.log("in listMessages...");
        console.log(query);
        this.unblock();            
        var tokens = Tokens.findOne();            
        var apiUrl = "https://www.googleapis.com/gmail/v1/users/me/messages";
        if (query.length)
            apiUrl = apiUrl + "?q=" + query;
        try {
            var result = HTTP.get( apiUrl, {
                params: {
                    'access_token': tokens.accessToken
                }
            });
            console.log(result);
            return result.data;
        } catch(error){
            return error;
        }
    },
    
    getMessage: function(messageID){
        console.log("in getMessage...");
        console.log(messageID);
        this.unblock();            
        var tokens = Tokens.findOne();            
        var apiUrl = "https://www.googleapis.com/gmail/v1/users/me/messages/" + messageID;
        try {
            var result = HTTP.get( apiUrl, {
                params: {
                    'access_token': tokens.accessToken
                }                
            });                        
            var extractField = function(json, fieldName) {
                return json.payload.headers.filter(function(header) {
                return header.name === fieldName;
                })[0];
            };
            var message = {
                'messageID':messageID,
                'date':     extractField(result.data, "Date"),
                'subject':  extractField(result.data, "Subject").value,
                'body':     uintToString(Base64.decode(result.data.payload.parts[0].body.data))
            };
            return message;
        } catch(error){
            return error;
        }
    },
    
    getHistory: function(historyID){
        console.log("in getHistory...");
        console.log("historyID: " + historyID);
        this.unblock();            
        var tokens = Tokens.findOne();            
        var apiUrl = "https://www.googleapis.com/gmail/v1/users/me/history?startHistoryId=" + historyID;
        try {
            var result = HTTP.get( apiUrl, {
                params: {
                    'access_token': tokens.accessToken
                }
            });
            console.log(result);
            return result;
        } catch(error){
            return error;
        }
    },
    
    archiveMessage: function(messageID){
        console.log("in archiveMessage...");
        console.log(messageID);
        this.unblock();            
        var tokens = Tokens.findOne();            
        var apiUrl = "https://www.googleapis.com/gmail/v1/users/me/messages/" + messageID + "/modify";
        try {
            var result = HTTP.post( apiUrl, {
                data: { "removeLabelIds": ["INBOX"] },
                headers:{"content-type":"application/json ; charset=UTF-8", "Authorization": "Bearer " + tokens.accessToken }
            });
            console.log("result:" + result);
            return result;
        } catch(error){
            console.log("error:" + error);
            return error;
        }
    },
    
    importFromInbox: function(){
        console.log("in importFromInbox...");
        var result = "";
        //get messages
        var inbox = Meteor.call('listMessages', 'label:inbox');
        if (inbox.messages && inbox.messages.length)
        {
            for (var i = 0; i < inbox.messages.length; i++) {    
                //get the message
                console.log("processing messageID: " + inbox.messages[i].id);
                var message = Meteor.call('getMessage', inbox.messages[i].id);
                //TODO: import it in the database
                //for now just log it
                console.log(message);
                //archive it
                var archive = Meteor.call('archiveMessage', inbox.messages[i].id);
            }
            result = inbox.messages.length + " messages processed";
        } else {
            result = "No messages to import";
        }
        return result;        
    },
    
    startPollingInbox: function(seconds){
        pollingTaskID = Meteor.setInterval(function(){
            Meteor.call('importFromInbox');
        }, seconds*1000);
        return "polling started...";
    },
    
    stopPollingInbox: function(){        
        Meteor.clearInterval(pollingTaskID);
        return "polling stopped...";
    }
    
});



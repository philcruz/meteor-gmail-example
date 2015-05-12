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
            return error;
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
            console.log(result);
            return result;
        } catch(error){
            return error;
        }
    }

    
});



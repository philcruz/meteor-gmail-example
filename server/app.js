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
    }

    
});



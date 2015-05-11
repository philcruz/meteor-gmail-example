Template.oauth.helpers({
    code: function() { 
        var controller = Iron.controller();
        var code = controller.getParams().query.code;
        if (! code)
            return null;
        else
            return code;
    }
});


Template.oauth.events({

    'click #getTokensButton': function(){        
        var controller = Iron.controller();
        var code = controller.getParams().query.code;
        Meteor.call("exchangeCodeForTokens", code, function(error, results) {
            console.log(results); 
        });
    }

});



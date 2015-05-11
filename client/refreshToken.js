Template.refreshToken.events({

    'click #exchangeRefreshTokenButton': function(){                
        Meteor.call("exchangeRefreshToken",  function(error, results) {
            console.log(results); 
        });
    }

});

Template.gmail.events({

    'click #searchGmailButton': function(){
        var query = "";
        var search = $('#search').val();
        Meteor.call("searchGmail", search, function(error, results) {
            console.log(results); 
            if (error){
                console.log("Problem calling searchGmail...try refreshing the access token.");
                console.log(error);
            }
        });
    }

});




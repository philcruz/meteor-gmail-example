Template.gmail.events({

    'click #listThreadsButton': function(){
        var search = $('#search').val();
        Meteor.call("listThreads", search, function(error, results) {            
            if (error){
                console.log("Problem calling listThreads...try refreshing the access token.");
                console.log(error);
            } else {
                console.log(error);
                console.log(results);     
            }
        });
    },
    
    'click #listMessagesButton': function(){        
        var search = $('#search').val();
        Meteor.call("listMessages", search, function(error, results) {
            console.log(results); 
            if (error){
                console.log("Problem calling listMessages...try refreshing the access token.");
                console.log(error);
            }
        });
    },
    
     'click #getMessageButton': function(){        
        var messageID = $('#messageID').val();
        Meteor.call("getMessage", messageID, function(error, results) {                    
            if (error){
                console.log("Problem calling getMessage...try refreshing the access token.");
                console.log(error);
            } else {
                console.log(results);
            }
        });
    },
    
    'click #getHistoryButton': function(){        
        var historyID = $('#historyID').val();
        Meteor.call("getHistory", historyID, function(error, results) {
            console.log(results);            
            if (error){
                console.log("Problem calling getHistory...try refreshing the access token.");
                console.log(error);
            }
        });
    },
    
    'click #archiveMessageButton': function(){        
        var messageID = $('#messageID').val();
        Meteor.call("archiveMessage", messageID, function(error, results) {            
            if (error){
                console.log("Problem calling archiveMessage...try refreshing the access token.");
                console.log(error);
            } else {
                console.log("message archived..");
                console.log(results);
            }
        });
    },
    
    'click #importFromInboxButton': function(){        
        Meteor.call("importFromInbox", function(error, results) {            
            if (error){
                console.log("Problem calling importFromInbox...try refreshing the access token.");
                console.log(error);
            } else {
                console.log("inbox was processed..");
                console.log(results);
            }
        });
    }


});




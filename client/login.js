

Template.login.helpers({
    loginUrl: function() { 
        var loginUrl = "https://accounts.google.com/o/oauth2/auth?scope=" + Meteor.settings.public.scope
                    + "&redirect_uri=" + Meteor.settings.public.redirect_uri
                    + "&response_type=code&client_id=" + Meteor.settings.public.client_id
                    + "&access_type=offline";
        return loginUrl;
    }
});
var chats = new Meteor.Collection("chats");

if (Meteor.isClient) {
  Meteor.subscribe("messages");

  var soundSent = new buzz.sound("/sounds/sent", {
      formats: [ "ogg", "mp3" ],
      preload: true
  });

  var soundReceived = new buzz.sound("/sounds/received", {
      formats: [ "ogg", "mp3" ],
      preload: true
  });

  Template.chats.created = function() {
    this.playSounds = false;
    var self = this;
    Meteor.setTimeout(function() {
      self.playSounds = true;
    }, 2000);
    this.fxObserver = chats.find().observe({
      added: function(doc) {
        if (self.playSounds) {
          if (doc.user !== Meteor.userId()) {
            soundReceived.play();
          }
        }
      }
    });
  };

  Template.chats.helpers({
    messages: function() {
      return chats.find({}, {sort: {createdOn: -1}});
    },
    name: function() {
      var user = Meteor.users.findOne(this.user) || {};
      if (user.profile && user.profile.name) {
        return user.profile.name;
      } else if (user && user.emails && user.emails[0]){
        return user.emails[0].address;
      } else {
        return "?";
      }
    },
    stamp: function() {
      return moment(this.createdOn).format('H:mm:ss A');
    }
  });

  Template.chats.events({
    'keypress input': function(e, t) {
      if (e.which === 13) { // Return
        var message = e.target.value;
        e.target.value = '';
        
        soundSent.play();

        Meteor.call("addChat", {content: message})
      }
    }
  });

  Template.setup.events({
    'click button': function(e, t) {
      Meteor.users.update(Meteor.user()._id, {$set: {profile: {name: t.find('input').value}}});
    },
    'keypress input': function(e, t) {
      if (e.which === 13) {
        t.find('button').click();
      }
    }
  });

  Template.setup.helpers({
    username: function() {
      return Meteor.user().profile ? Meteor.user().profile.name : '';
    }
  });
}

if (Meteor.isServer) {
  Meteor.publish("messages", function() {
    return [chats.find({}, {limit: 30, sort: {createdOn: -1}}), Meteor.users.find({},{fields: {profile: 1, emails: 1}})];
  });

  Meteor.methods({
    addChat: function(doc) {
      doc.user = this.userId;
      doc.createdOn = (new Date()).getTime();
      chats.insert(doc);
    }
  });
}

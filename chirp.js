var chats = new Meteor.Collection("chats");

if (Meteor.isClient) {
  Meteor.subscribe("messages");

  Template.chats.helpers({
    messages: function() {
      return chats.find({}, {sort: {createdOn: -1}});
    },
    name: function() {
      var user = Meteor.users.findOne(this.user) || {};
      if (user.profile && user.profile.name) {
        return user.profile.name;
      } else {
        return Meteor.user().emails[0].address;
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
  })
}

if (Meteor.isServer) {
  Meteor.publish("messages", function() {
    return chats.find({}, {limit: 30, sort: {createdOn: -1}});
  });

  Meteor.methods({
    addChat: function(doc) {
      doc.user = this.userId;
      doc.createdOn = (new Date()).getTime();
      chats.insert(doc);
    }
  });
}

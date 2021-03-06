(function (){
    angular
        .module("BookReviewApp")
        .controller("MessageListController", MessageListController)
        .controller("MessageChatController", MessageChatController);

    function MessageListController($routeParams, $location, UserService, MessageService) {
        var vm = this;

        var userId = $routeParams['uid'];

        vm.navigateToChatView = navigateToChatView;
        vm.navigateToProfile = navigateToProfile;
        vm.getDateString = getDateString;

        vm.messages = [];
        vm.listOfFriendsTOBeDisplayed = [];

        function init() {
            MessageService
                .getAllMessagesForUser(userId)
                .success(function (listOfMessages) {
                    vm.messages = listOfMessages;
                    setListOfFriendsToBeDisplayed(listOfMessages);
                })
                .error(function (error) {
                });

            function setListOfFriendsToBeDisplayed(messages) {
                var listOfFriendsIds = [];
                var friendIdVsMessageStatus = {};
                for (var m in messages) {
                    var message = messages[m];
                    var friendId = (message.fromId === userId) ? message.toId : message.fromId;
                    if (0 > listOfFriendsIds.indexOf(friendId)) {
                        listOfFriendsIds.push(friendId);
                    }
                    if (!(friendId in friendIdVsMessageStatus)) {
                        friendIdVsMessageStatus[friendId] = message.toStatus;
                    } else {
                        if ('UNREAD' === message.toStatus) {
                            friendIdVsMessageStatus[friendId] = message.toStatus;
                        }
                    }
                }
                UserService
                    .bulkFindUsersByIds(listOfFriendsIds)
                    .success(function (listOfUsers) {
                        vm.listOfFriendsTOBeDisplayed = listOfUsers;
                        for (var f in vm.listOfFriendsTOBeDisplayed) {
                            var friend = vm.listOfFriendsTOBeDisplayed[f];
                            var friendMessageStatus = friendIdVsMessageStatus[friend._id];
                            //friend['boldStatus'] = ('UNREAD' == friendMessageStatus);
                            friend['messageStatus'] = friendMessageStatus;
                        }
                    })
                    .error(function (error) {
                    });
            }
        }
        init();

        function navigateToChatView(friend) {
            $location.url("/user/" + userId + "/message/" + friend._id);
        }

        function navigateToProfile() {
            $location.url("/user/" + userId);
        }

        function getDateString(date) {
            return date.toDateString();
        }
    }

    function MessageChatController($routeParams, $location, UserService, MessageService) {
        var vm = this;
        var userId = $routeParams['uid'];
        var friendId = $routeParams['fid'];

        vm.userId = userId;
        vm.nameOfFriend = "";
        vm.listOfFriendIds = [];
        vm.sendMessage = sendMessage;
        vm.deleteMessage = deleteMessage;
        vm.navigateToProfile = navigateToProfile;
        vm.getMessageTime = getMessageTime;
        vm.checkIfOtherUserIsFriend = checkIfOtherUserIsFriend;
        vm.addFriend = addFriend;
        vm.navigateToAllMessages = navigateToAllMessages;

        function listOfFriendIdsInit() {
            UserService
                .findFriendsForUser(userId)
                .success(function (listOfFriends) {
                    vm.listOfFriendIds = [];
                    for (var f in listOfFriends) {
                        vm.listOfFriendIds.push(listOfFriends[f]._id);
                    }
                })
                .error(function (error) {
                });
        }
        listOfFriendIdsInit();

        function init(isMarkingAsUnreadNecessary){
            MessageService
                .getMessagesFromOneUserToAnotherUser(userId, friendId)
                .success(function (listOfMessages) {
                    vm.messages = listOfMessages;
                    if (isMarkingAsUnreadNecessary) {
                        markAllMessagesAsRead(vm.messages);
                        init(false);
                    }
                })
                .error(function (err){
                    vm.info = "No messages found";
                });
            UserService
                .findUserById(friendId)
                .success(function (friend) {
                    //vm.nameOfFriend = (friend.firstName + " " + friend.lastName).trim();
                    vm.nameOfFriend = friend.firstName.trim();
                })
        }
        init(true);

        function markAllMessagesAsRead(messages) {
            for (var m in messages) {
                MessageService.setMessageStatusAsRead(messages[m]._id);
            }
        }

        function sendMessage(messageText) {
            if (undefined !== messageText && null !== messageText && "" !== messageText) {
                MessageService
                    .createMessage(userId, friendId, messageText)
                    .success(function (response) {
                        document.getElementById("messageText").value = "";
                        init(false);
                    })
                    .error(function (error) {
                    });
            }
        }

        function deleteMessage(messageId) {
            MessageService
                .deleteMessage(messageId)
                .then(function (response) {
                    init();
                }, function (err) {
                    vm.error = "Error deleting message"
                });

        }

        function navigateToProfile() {
            $location.url("/user/" + userId);
        }

        function navigateToAllMessages() {
            $location.url("/user/" + userId + "/message");
        }

        function getMessageTime(dateCreated) {
            var d = new Date(dateCreated);
            return d.toDateString() + ", " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
        }

        function checkIfOtherUserIsFriend() {
            return (-1 < vm.listOfFriendIds.indexOf(friendId));
        }

        function addFriend() {
            if (userId !== friendId) {
                UserService
                    .addFriend(userId, {_id: friendId})
                    .success(function (response) {
                        listOfFriendIdsInit();
                    })
                    .error(function (error) {
                    });
            }
        }
    }
})();
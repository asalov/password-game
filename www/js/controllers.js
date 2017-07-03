angular.module('password-game.controllers', ['password-game.services'])

// Global controller
.controller('AppController', function($scope, $ionicHistory){
    $scope.loadingSettings = {
        emplate: '<ion-spinner></ion-spinner>',
        noBackdrop: true
    };

	$scope.$on('$ionicView.beforeEnter', function(){
		$scope.isHomePage = ($ionicHistory.currentStateName() === 'app.home');
	});
})

.controller('HomeController', function($scope){
	$scope.quit = function(){
		ionic.Platform.exitApp();
	};
})

.controller('GameOptionsController', function($scope, GameService){
	// Default values
	$scope.gameOptions = GameService.getGameOptions();

	$scope.setOptions = function(type, length, total, numRounds){
		GameService.setGameOptions(type, length, total, numRounds);
	};
})

.controller('TeamsGameController', function($scope, $filter, GameService, APIService){
	$scope.$on('$ionicView.beforeEnter', function(){
		$scope.isCompetative = GameService.isCompetative();
		
		$scope.teamOptions = {
			teamOne: '',
			teamTwo: ''
		};

		if($scope.isCompetative){
			$scope.teamOptions.teamOne = 'full';
			$scope.teamOptions.teamTwo = 'full';
		}

		resetSelectedValues();

		$scope.teamOne = {};
		$scope.teamTwo = {};
	});

	APIService.getTeams(function(res){
		$scope.teams = res;	
	});

	APIService.getPlayers(function(res){
		$scope.players = res;
	});

	$scope.teamOneChange = function(){
		$scope.teamOne = {};
	};

	$scope.teamTwoChange = function(){
		$scope.teamTwo = {};
	};

	$scope.setTeams = function(){
		GameService.setTeams($scope.teamOne, $scope.teamTwo);
	};

	$scope.teamSelection = function(type, selection){
		if(selection){
			switch(type){
				case 'full':
					$scope.disabledValues.team = $filter('filter')($scope.teams, {id: selection})[0];
				break;
				case 'individual':
					$scope.disabledValues.players = selection;
				break;
			}	
		}else{
			resetSelectedValues();
		}
	};

	function resetSelectedValues(){
		$scope.disabledValues = {
			team: null,
			players: []
		};		
	}
})

.controller('GameController', function($scope, $state, $ionicModal, $ionicPopup, $cordovaVibration, GameService){
	$scope.$on('$ionicView.beforeEnter', function(){
		resetBoard();

		$scope.teams = GameService.getTeams();

		$scope.isMatch = GameService.isMatch();

		GameService.generateWords();
	});

	$scope.words = ['lazy', 'brown', 'fox', 'wizard', 'evil', 'queen', 'lumberjack', 'potion', 'brewery'];

	$scope.generateWord = function(){
		$scope.word = GameService.getRandomWord();

		$scope.wordGenerated = true;
	};

	$scope.beginRound = function(word){
		console.log(word);
		
		GameService.chosenWord(word);

		$scope.roundStarted = true;
	};

	$ionicModal.fromTemplateUrl('templates/game/game_modal.html', {
		scope: $scope
	}).then(function(modal){
		$scope.modal = modal;
	});

	$scope.openPointsMenu = function(){
		$scope.modal.show();
	};

	$scope.closeModal = function(){
		$scope.modal.hide();
	};

	$scope.addPoints = function(team, points){
		var guessedTeam = GameService.wordGuessed(team, points);

		$cordovaVibration.vibrate(100);

		$scope.closeModal();

		if(GameService.gameEnded(guessedTeam)){
			if(GameService.isCompetative) GameService.saveMatch(guessedTeam);

			$ionicPopup.show({
				title: 'Congratulations!',
				template: '<p>' + guessedTeam.name + ' has won the game!</p>',
				buttons: [
					{
						text: 'Start new game',
						type: 'button-calm button-block',
						onTap: function(){
							this.hide();

							GameService.gameOver();

							$state.transitionTo('app.game-options');
						}
					},
					{
						text: 'Exit to main menu',
						type: 'button-stable button-block',
						onTap: function(){
							this.hide();

							GameService.gameOver();

							$state.transitionTo('app.home');
						}
					}
				]
			});
		}else if(GameService.roundEnded(guessedTeam)){
			$ionicPopup.show({
				title: 'Congratulations!',
				template: '<p>' + guessedTeam.name + ' has won the round!</p>',
				buttons: [
					{
						text: 'Next round',
						type: 'button-calm button-block',
						onTap: function(){
							this.hide();

							GameService.nextRound(guessedTeam);
						}
					},
					{
						text: 'Exit to main menu',
						type: 'button-stable button-block',
						onTap: function(){
							this.hide();

							GameService.gameOver();

							$state.transitionTo('app.home');
						}
					}
				]
			});
		}else{
			resetBoard();
		}
	};

	function resetBoard(){
		$scope.wordGenerated = false;
		$scope.roundStarted = false;

		delete $scope.word;

		$scope.guess = {
			points: 1,
			team: false
		};
	}
})

.controller('RankController', function($scope, $state, $ionicLoading, APIService, ProfileService){
	APIService.getTeamStatsAll(function(res){
		$scope.teams = res;
	});

	APIService.getPlayerStatsAll(function(res){
		$scope.players = res;
	});

	$scope.showProfile = function(type, id){
		$ionicLoading.show($scope.loadingSettings);

		ProfileService.findProfile(type, id, function(res){
			ProfileService.setProfile(res);

			$ionicLoading.hide();
			
			$state.transitionTo('app.profile.about');
		});
	};
})

.controller('ProfilesController', function($scope, $state, $ionicLoading, APIService, ProfileService){
	APIService.getTeams(function(res){
		$scope.teamProfiles = res;	
	});

	APIService.getPlayers(function(res){
		$scope.playerProfiles = res;
	});

	$scope.showProfile = function(type, id){
		$ionicLoading.show($scope.loadingSettings);

		ProfileService.findProfile(type, id, function(res){
			ProfileService.setProfile(res);

			$ionicLoading.hide();

			$state.transitionTo('app.profile.about');
		});
	};
})

.controller('ProfileController', function($scope, $state, $stateParams, APIService, ProfileService){
	$scope.profile = ProfileService.getProfile();
})

.controller('RegisterController', function($scope, $timeout, $ionicLoading, $ionicPopup, APIService, Camera, File){
	
	$scope.$on('$ionicView.beforeEnter', function(){
		$scope.player = {
			avatar: {
				selected: false
			}
		};
		$scope.team = {
			avatar: {
				selected: false
			}
		};
	});

	APIService.getPlayers(function(res){
		$scope.players = res;
	});

	$scope.getGalleryPhoto = function(item){
		Camera.getPhotoFromGallery().then(function(res){
			item.avatar = {
				selected: true,
				url: res
			};
		});
	};

	$scope.takePhoto = function(item){
		Camera.takePhoto().then(function(res){
			item.avatar = {
				selected: true,
				url: res
			};
		});
	};

	$scope.selectNewPhoto = function(item){
		File.deleteFromPath(item.avatar.url).then(function(res){
			item.avatar.selected = false;
		});
	};

	$scope.registerPlayer = function(player){
		$ionicLoading.show($scope.loadingSettings);

		APIService.createPlayer(player, function(){
			$scope.player = {};

			$ionicLoading.hide();

			showConfirmation('Player registered!');
		});
	};

	$scope.registerTeam = function(team){
		$ionicLoading.show($scope.loadingSettings);

		APIService.createTeam(team, function(){
			$scope.team = {};

			$ionicLoading.hide();

			showConfirmation('Team registered!');
		});
	};

    function showConfirmation(text){
        var template = '<i class="ion-icon ion-checkmark-circled"></i> ' + text;

        var popup = $ionicPopup.show({
            template: template,
            cssClass: 'confirmation'
        });

        $timeout(function(){
            popup.close();
        }, 750);     
    }
});
angular.module('password-game.services', [])

.service('GameService', function($filter, APIService){
	var defaults = {
		type: 'casual',
		length: 'single',
		total: 11,
		rounds: 0	
	};

	var gameOptions = defaults;
	var teams = [];
	var words = [];

	this.getTotal = function(){
		return gameOptions.total;
	};

	this.getLength = function(){
		return gameOptions.length;
	};

	this.getType = function(){
		return gameOptions.type;
	};

	this.getGameOptions = function(){
		return gameOptions;
	};

	this.setGameOptions = function(type, length, total, rounds){
		gameOptions.type = type;
		gameOptions.length = length;
		gameOptions.total = total;
		gameOptions.rounds = rounds;
	};

	this.setTeams = function(teamOne, teamTwo){
		teams = [];

		createTeam(teamOne);
		createTeam(teamTwo);
	};

	this.getTeam = function(name){
		return $filter('filter')(teams, {name: name})[0];
	};

	this.getTeams = function(){
		return teams;
	};

	this.isCompetative = function(){
		return gameOptions.type === 'competative';
	};

	this.isMatch = function(){
		return gameOptions.length === 'match';		
	};

	this.generateWords = function(){
		APIService.getWords(function(res){
			var len = res.length;

			for(var i = 0; i < len; i++){
				words.push(res[i].word);
			}
		});
	};

	this.getRandomWord = function(){
		var index = Math.floor(Math.random() * words.length);

		return words[index];
	};

	this.chosenWord = function(word){
		var index = words.indexOf(word);

		words.splice(index, 1);
	};

	this.wordGuessed = function(team, points){
		var guessedTeam = this.getTeam(team);
		
		guessedTeam.score += Number(points);

		return guessedTeam;
	};

	this.gameEnded = function(guessedTeam){
		if(this.isMatch()){
			return (guessedTeam.score >= gameOptions.total && guessedTeam.rounds === gameOptions.rounds - 1);
		}else{
			return guessedTeam.score >= gameOptions.total;
		}
	};

	this.roundEnded = function(guessedTeam){
		if(gameOptions.length === 'match'){
			return guessedTeam.score >= gameOptions.total;
		}

		return false;
	};

	this.nextRound = function(winningTeam){
		winningTeam.rounds++;

		teams[0].score = 0;
		teams[1].score = 0;
	};

	this.gameOver = function(){
		gameOptions = defaults;
		teams = [];
		words = [];
	};

	this.saveMatch = function(winningTeam){
		var losingTeam = (teams[0].id !== winningTeam.id) ? teams[0] : teams[1];

		var match = {
			type: gameOptions.length,
			winner: winningTeam.id,
			loser: losingTeam.id,
			score: winningTeam.score + '-' + losingTeam.score
		};

		APIService.createMatch(match);
	};

	function createTeam(team){
		if(Object.keys(team).length === 0) return; // TEMPORARY

		var gameTeam = {
			players: [],
			score: 0
		};

		if(team.id){
			APIService.getTeam(team.id, function(res){
				gameTeam.id = res.id;
				gameTeam.name = res.name;
				gameTeam.bio = res.bio;
				gameTeam.score = 0;

				APIService.getPlayersInTeam(team.id, function(res){
					gameTeam.players = res;
				});
			});
		}else if(team.players instanceof Array){
			APIService.getPlayer(team.players[0], function(res){
				gameTeam.players.push(res);

				APIService.getPlayer(team.players[1], function(res){
					gameTeam.players.push(res);

					setTeamName(gameTeam, team.name, gameTeam.players);
				});
			});
		}else{
			for(var x in team.players){
				gameTeam.players.push(team.players[x]);
			}

			setTeamName(gameTeam, team.name, team.players);
		}

		if(gameOptions.length === 'match') gameTeam.rounds = 0;

		teams.push(gameTeam);
	}

	function setTeamName(team, name, players){
		team.name = (name) ? name : players[0].name + ' & ' + players[1].name;
	}
})

.service('ProfileService', function(APIService){
	var currentProfile = {};

	this.findProfile = function(type, id, callback){
		var profile = {};

		switch(type){
			case 'team':
				APIService.getTeam(id, function(res){
					profile.id = res.id;
					profile.name = res.name;
					profile.bio = res.bio;
					profile.avatar = res.avatar;

					APIService.getPlayersInTeam(profile.id, function(res){
						profile.players = res;

						APIService.getTeamStats(profile.id, function(res){
							profile.stats = {
								matches: res.matches,
								wins: res.wins,
								losses: res.losses
							};

							callback(profile);
						});
					});
				});

			break;
			case 'player':
				APIService.getPlayer(id, function(res){
					profile = res;

					APIService.getPlayerStats(profile.id, function(res){
						profile.stats = {
							matches: res.matches,
							wins: res.wins,
							losses: res.losses
						};

						callback(profile);
					});
				});
			break;
		}
	};

	this.setProfile = function(value){
		currentProfile = value;
	};

	this.getProfile = function(){
		return currentProfile;
	};
})

.service('APIService', function($ionicPlatform, $http, File){
	var endpoint = 'YOUR_SERVER_API_ENDPOINT';
	var wordAPIEndpoint = 'http://api.wordnik.com/v4/words.json/randomWords';

	this.createPlayer = function(player, callback){
		if(player.avatar.selected){
			player.avatar.url = File.formatPhotoFilename(player.avatar.url);

			var options = {
				params: {
					username: player.username,
					name: player.name,
					email: player.email,
					bio: player.bio
				}
			};

			File.upload(endpoint + 'players', player.avatar.url, options).then(function(res){
				File.deleteFromPath(player.avatar.url);

				callback();
			}, function(err){
				console.log(err);
			});
		}else{
			$http.post(endpoint + 'players', player).then(function(res){
				callback();
			}, function(err){
				console.log(err);
			});			
		}
	};

	this.getPlayers = function(callback, refresh){
		sendRequest(endpoint + 'players', callback, refresh);
	};

	this.getPlayer = function(id, callback, refresh){
		sendRequest(endpoint + 'players/' + id, callback, refresh);
	};

	this.createTeam = function(team, callback){
		if(team.avatar.selected){
			team.avatar.url = File.formatPhotoFilename(team.avatar.url);

			var options = {
				params: {
					name: team.name,
					player1: team.players[0],
					player2: team.players[1],
					bio: team.bio
				}
			};

			File.upload(endpoint + 'teams', team.avatar.url, options).then(function(res){
				File.deleteFromPath(team.avatar.url);

				callback();
			}, function(err){
				console.log(err);
			});	
		}else{
			$http.post(endpoint + 'teams', team).then(function(res){
				callback();
			}, function(err){
				console.log(err);
			});			
		}
	};

	this.getTeams = function(callback, refresh){
		sendRequest(endpoint + 'teams', callback, refresh);
	};

	this.getTeam = function(id, callback, refresh){
		sendRequest(endpoint + 'teams/' + id, callback, refresh);
	};

	this.getPlayersInTeam = function(id, callback, refresh){
		sendRequest(endpoint + 'teams/' + id + '/players', callback, refresh);
	};

	this.createMatch = function(match){
		$http.post(endpoint + 'matches', match).then(function(res){
			console.log(res);
		}, function(err){
			console.log(err);
		});
	};

	this.getTeamStatsAll = function(callback, refresh){
		sendRequest(endpoint + 'teams/stats', callback, refresh);
	};

	this.getTeamStats = function(id, callback, refresh){
		sendRequest(endpoint + 'teams/' + id + '/stats', callback, refresh);
	};

	this.getPlayerStatsAll = function(callback, refresh){
		sendRequest(endpoint + 'players/stats', callback, refresh);
	};

	this.getPlayerStats = function(id, callback, refresh){
		sendRequest(endpoint + 'players/' + id + '/stats', callback, refresh);
	};

	this.getWords = function(callback){
		var params = {
			hasDictionaryDef: false,
			includePartOfSpeech: 'noun',
			excludePartOfSpeech: 'noun-plural',
			minLength: 5,
			limit: 100,
			api_key: 'YOUR_WORDNIK_API_KEY'
		};

		var urlParams = [];

		for(var x in params){
			urlParams.push(x + '=' + params[x]);
		}

		urlParams = urlParams.join('&');

		$http.get(wordAPIEndpoint + '?' + encodeURI(urlParams)).then(function(res){
			callback(res.data);
		}, function(err){
			console.log(err);
		});
	};

	function sendRequest(endpoint, callback, refresh){
		var cache = refresh === undefined;
	
		var options = {
			cache: cache
		};

		$http.get(endpoint, options).then(function(res){
			callback(res.data.result);
		}, function(err){
			console.log(err);
		});
	}
})

.factory('Camera', function($ionicPlatform, $cordovaCamera){
	var camera = {};

	$ionicPlatform.ready(function(){
		var options = {
			quality: 50,
			destinationType: Camera.DestinationType.FILE_URI,
			allowEdit: false,
			correctOrientation: true,
			saveToPhotoAlbum: false
		};

		camera.takePhoto = function(){
			options.sourceType = Camera.PictureSourceType.CAMERA;

			return $cordovaCamera.getPicture(options);
		};

		camera.getPhotoFromGallery = function(){
			options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;

			return $cordovaCamera.getPicture(options);		
		};
	});

	return camera;
})

.factory('File', function($ionicPlatform, $cordovaFile, $cordovaFileTransfer){
	var file = {};

	function getFileNameFromPath(path){
		var fileNamePos = path.lastIndexOf('/') + 1;

		return path.substr(fileNamePos);
	}

	function getDirFromPath(path){
		var fileNamePos = path.lastIndexOf('/') + 1;

		return path.substr(0, fileNamePos);
	}

	$ionicPlatform.ready(function(){
		file.deleteFromPath = function(path){
			var fileName = getFileNameFromPath(path);
			var dir = getDirFromPath(path);

			return this.delete(dir, fileName);
		};

		file.delete = function(path, fileName){
			return $cordovaFile.removeFile(path, fileName);
		};

		file.clearStorageFromPath = function(path){
			var dir = getDirFromPath(path);

			return this.clearStorage(dir, '');
		};

		file.clearStorage = function(path, dir){
			return $cordovaFile.removeRecursively(path, dir);
		};

		file.upload = function(dest, photoUrl, options){
			var fileName = getFileNameFromPath(photoUrl);
			
			options.fileName = fileName;

			return $cordovaFileTransfer.upload(dest, photoUrl, options);
		};

		file.formatPhotoFilename = function(photoUrl){
			return photoUrl.substr(0, photoUrl.lastIndexOf('.jpg') + 4);
		};
	});

	return file;
});
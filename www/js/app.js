angular.module('password-game', ['ionic', 'ngCordova', 'password-game.controllers'])

.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins.Keyboard) {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

          // Don't remove this line unless you know what you are doing. It stops the viewport
          // from snapping when text inputs are focused. Ionic handles this internally for
          // a much nicer keyboard experience.
          cordova.plugins.Keyboard.disableScroll(true);
        }
    
        if(window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})

.config(function($stateProvider, $urlRouterProvider){
    $stateProvider

    .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/layout.html',
        controller: 'AppController'
    })

    .state('app.home', {
        url: '/home',
        views: {
            'content': {
                templateUrl: 'templates/home.html',
                controller: 'HomeController'      
            }
        }
    })

    .state('app.game-options', {
        url: '/game-options',
        views: {
            'content': {
                templateUrl: 'templates/game/options.html',
                controller: 'GameOptionsController'      
            }
        }
    })

    .state('app.choose-teams', {
        url: '/choose-teams',
        views: {
            'content': {
                templateUrl: 'templates/game/choose_teams.html',
                controller: 'TeamsGameController'      
            }
        }
    })

    .state('app.game', {
        url: '/game',
        views: {
            'content': {
                templateUrl: 'templates/game/game.html',
                controller: 'GameController'      
            }
        }
    })

    .state('app.register', {
        url: '/register',
        cache: false,
        views: {
            'content': {
                templateUrl: 'templates/register/register.html',
                controller: 'RegisterController'      
            }
        }
    })

    .state('app.register.player', {
        url: '/player',
        views: {
            'player': {
                templateUrl: 'templates/register/register_player.html',
                controller: 'RegisterController'      
            }
        }
    })

    .state('app.register.team', {
        url: '/team',
        views: {
            'team': {
                templateUrl: 'templates/register/register_team.html',
                controller: 'RegisterController'      
            }
        }
    })

    .state('app.ranking', {
        url: '/ranking',
        cache: false,
        views: {
            'content': {
                templateUrl: 'templates/ranking/ranking.html'     
            }
        }
    })

    .state('app.ranking.players', {
        url: '/players-rank',
        views: {
            'player': {
                templateUrl: 'templates/ranking/ranking_players.html',
                controller: 'RankController'      
            }
        }
    })

    .state('app.ranking.teams', {
        url: '/teams-rank',
        views: {
            'team': {
                templateUrl: 'templates/ranking/ranking_teams.html',
                controller: 'RankController'      
            }
        }
    })    

    .state('app.profiles', {
        url: '/profiles',
        cache: false,
        views: {
            'content': {
                templateUrl: 'templates/profile/profiles.html'     
            }
        }
    })

    .state('app.profiles.players', {
        url: '/players-profiles',
        views: {
            'player': {
                templateUrl: 'templates/profile/profiles_players.html',
                controller: 'ProfilesController'      
            }
        }
    })

    .state('app.profiles.teams', {
        url: '/teams-profiles',
        views: {
            'team': {
                templateUrl: 'templates/profile/profiles_teams.html',
                controller: 'ProfilesController'      
            }
        }
    })

    .state('app.profile', {
        url: '/profile',
        cache: false,
        views: {
            'content': {
                templateUrl: 'templates/profile/profile.html'  
            }
        },
    })

    .state('app.profile.about', {
        url: '/about/:item/:id',
        views: {
            'about': {
                templateUrl: 'templates/profile/about.html',
                controller: 'ProfileController'      
            }
        }
    })

    .state('app.profile.stats', {
        url: '/stats',
        views: {
            'stats': {
                templateUrl: 'templates/profile/stats.html',
                controller: 'ProfileController'      
            }
        }
    });

    $urlRouterProvider.otherwise('/app/home');
});
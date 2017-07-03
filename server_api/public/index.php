<?php

require_once '../vendor/autoload.php';
require_once '../libs/functions.php';

use Slim\App;

$config = require_once '../config/config.php';

ORM::configure([
	'connection_string' => $config['db']['driver'] . ':host=' . $config['db']['host'] . ';dbname=' . $config['db']['dbname'],
	'username' => $config['db']['user'],
	'password' => $config['db']['password']
]);

$app = new App(['settings' => $config]);

// Routes
$app->get('/teams', function ($req, $res, $args){
	$teams = ORM::forTable('teams')->findArray();

	return json($res, $teams);
});

$app->post('/teams', function ($req, $res, $args){
	$data = $req->getParsedBody();

	$newTeam = ORM::forTable('teams')->create();

	$newTeam->name = $data['name'];

	$newTeam->player1_id = $data['player1'];
	$newTeam->player2_id = $data['player2'];
	$newTeam->bio = ($data['bio']) ?: null;

	if($_FILES){
		$uploadSettings = $this->get('settings')->get('upload');
		$upload = new Upload($uploadSettings['destination'], $uploadSettings['max_file_size'], new ErrorHandler);

		$upload->move();

		if($upload->success()){
			$newTeam->avatar = $upload->fileLocations()[0];

			$success = $newTeam->save();

			return json($res, $success);
		}else{
			return json($res, $upload->errors()->all());
		}
	}else{
		$success = $newTeam->save();

		return json($res, $success);
	}
});

$app->get('/teams/stats', function($req, $res, $args){
	$q = "SELECT teams.id, teams.name, IFNULL(sub1.matches, 0) AS matches, IFNULL(sub2.wins, 0) AS wins, 
		  IFNULL(sub3.losses, 0) AS losses FROM teams LEFT JOIN (SELECT teams.id AS id, COUNT(*) AS matches 
		  FROM teams, matches WHERE teams.id IN (matches.winning_team_id, matches.losing_team_id) GROUP BY id) AS sub1 
		  ON teams.id = sub1.id LEFT JOIN (SELECT teams.id AS id, COUNT(*) AS wins FROM teams, matches WHERE teams.id IN 
		  (matches.winning_team_id) GROUP BY id) AS sub2 ON teams.id = sub2.id LEFT JOIN (SELECT teams.id AS id, 
		  COUNT(*) AS losses FROM teams, matches WHERE teams.id IN (matches.losing_team_id) GROUP BY id) AS sub3 
		  ON teams.id = sub3.id";

	$teamsStats = ORM::forTable('teams')->raw_query($q)->findArray();

	return json($res, $teamsStats);
});

$app->get('/teams/{id}', function ($req, $res, $args){
	$team = ORM::forTable('teams')->findOne($args['id']);

	$team = ($team) ? $team->asArray() : [];

	return json($res, $team);
});

$app->get('/teams/{id}/players', function ($req, $res, $args){
	$q = "SELECT players.* FROM players,teams 
		  WHERE players.id IN (teams.player1_id, teams.player2_id) 
		  AND teams.id = " . $args['id'];

	$playersInTeam = ORM::forTable('players')->raw_query($q)->findArray();

	return json($res, $playersInTeam);
});

$app->get('/teams/{teamId}/players/{playerId}', function ($req, $res, $args){
	 $q = "SELECT players.* FROM players,teams 
		   WHERE players.id IN (teams.player1_id, teams.player2_id) 
		   AND teams.id = " . $args['teamId'] . " AND players.id = " . $args['playerId'];

	 $playerInTeam = ORM::for_table('players')->raw_query($q)->findOne();

	 $playerInTeam = ($playerInTeam) ? $playerInTeam->asArray() : [];

	 return json($res, $playerInTeam);
});

$app->get('/teams/{id}/stats', function ($req, $res, $args){
	$id = $args['id'];
	$q = "SELECT teams.id, teams.name, (SELECT COUNT(*) FROM teams, matches WHERE teams.id 
		  IN (matches.winning_team_id, matches.losing_team_id) AND teams.id = {$id}) AS 'matches', 
		  (SELECT COUNT(*) FROM teams,matches WHERE teams.id IN (matches.winning_team_id) AND teams.id = {$id}) AS 'wins', 
		  (SELECT COUNT(*) FROM teams, matches WHERE teams.id IN (matches.losing_team_id) AND teams.id = {$id}) AS 'losses' 
		  FROM teams WHERE teams.id = {$id}";

	$teamStats = ORM::forTable('teams')->raw_query($q)->findOne();

	$teamStats = ($teamStats) ? $teamStats->asArray() : [];

	return json($res, $teamStats);
});

$app->get('/players', function ($req, $res, $args){
	$players = ORM::forTable('players')->findArray();

	return json($res, $players);
});

$app->post('/players', function ($req, $res, $args){
	$data = $req->getParsedBody();

	$newPlayer = ORM::forTable('players')->create();
	
	$newPlayer->username = $data['username'];
	$newPlayer->name = $data['name'];
	$newPlayer->email = $data['email'];
	$newPlayer->bio = ($data['bio']) ?: null;

	if($_FILES){
		$uploadSettings = $this->get('settings')->get('upload');

		$upload = new Upload($uploadSettings['destination'], $uploadSettings['max_file_size'], new ErrorHandler);

		$upload->move();

		if($upload->success()){
			$newPlayer->avatar = $upload->fileLocations()[0];

			$success = $newPlayer->save();

			return json($res, $success);
		}else{
			return json($res, $upload->errors()->all());
		}
	}else{
		$success = $newPlayer->save();

		return json($res, $success);
	}
});

$app->get('/players/stats', function($req, $res, $args){
	$q = "SELECT players.id, players.name, IFNULL(sub1.matches, 0) AS matches, IFNULL(sub2.wins, 0) AS wins, 
		  IFNULL(sub3.losses, 0) AS losses FROM players LEFT JOIN (SELECT players.id AS id, COUNT(*) AS matches 
		  FROM players, teams, matches WHERE players.id IN (teams.player1_id, teams.player2_id) AND teams.id 
		  IN (matches.winning_team_id, matches.losing_team_id) GROUP BY id) AS sub1 ON players.id = sub1.id LEFT JOIN 
		  (SELECT players.id AS id, COUNT(*) AS wins FROM players, teams, matches WHERE players.id 
		  IN (teams.player1_id, teams.player2_id) AND teams.id IN (matches.winning_team_id) GROUP BY id) AS sub2 
		  ON players.id = sub2.id LEFT JOIN (SELECT players.id AS id, COUNT(*) AS losses FROM players, teams, matches 
		  WHERE players.id IN (teams.player1_id, teams.player2_id) AND teams.id IN (matches.losing_team_id) GROUP BY id) AS sub3 
		  ON players.id = sub3.id;";

	$playersStats = ORM::forTable('teams')->raw_query($q)->findArray();

	return json($res, $playersStats);
});

$app->get('/players/{id}', function ($req, $res, $args){
	$player = ORM::forTable('players')->findOne($args['id']);

	$player = ($player) ? $player->asArray() : [];

	return json($res, $player);
});

$app->get('/players/{id}/stats', function ($req, $res, $args){
	$id = $args['id'];
	$q = "SELECT players.id, players.name, (SELECT COUNT(*) FROM players,teams, matches WHERE players.id 
		  IN (teams.player1_id, teams.player2_id) AND teams.id IN (matches.winning_team_id, matches.losing_team_id) 
		  AND players.id = {$id}) AS 'matches', (SELECT COUNT(*) FROM players,teams, matches WHERE players.id 
		  IN (teams.player1_id, teams.player2_id) AND teams.id IN (matches.winning_team_id) AND players.id = {$id}) AS 'wins', 
		  (SELECT COUNT(*) FROM players,teams, matches WHERE players.id IN (teams.player1_id, teams.player2_id) AND teams.id 
		  IN (matches.losing_team_id) AND players.id = {$id}) AS 'losses' FROM players WHERE players.id = {$id}";

	$playerStats = ORM::forTable('players')->raw_query($q)->findOne();

	$playerStats = ($playerStats) ? $playerStats->asArray() : [];

	return json($res, $playerStats);
});

$app->post('/matches', function ($req, $res, $args){
	$data = $req->getParsedBody();

	$newMatch = ORM::forTable('matches')->create();

	$newMatch->type = $data['type'];
	$newMatch->winning_team_id = $data['winner'];
	$newMatch->losing_team_id = $data['loser'];
	$newMatch->score = $data['score'];

	$success = $newMatch->save();

	return json($res, $success);
});

$app->run();
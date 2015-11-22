var routesapp = angular.module("routesapp", ['ngResource', 'ngRoute', 'ngFileUpload' , 'uiGmapgoogle-maps', 'ui.bootstrap']);
routesapp.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/journeys/overview', {
            templateUrl: 'journeys/overview.html',
            controller: 'OverviewCtrl',
            title: 'Reizen overzicht'
        })
        .when('/journeys/plan/:id', {
            templateUrl: 'journeys/plan.html',
            controller: 'PlanCtrl',
            title: 'Reis plannen'
        })
        .when('/journeys/persons/:id', {
            templateUrl: 'journeys/persons.html',
            controller: 'PersonsCtrl',
            title: 'Personen toevoegen'
        })

}]);

app.controller('PlanCtrl', ['$scope', '$resource', 'uiGmapGoogleMapApi', '$routeParams',
    function($scope, $resource, uiGmapGoogleMapApi, $routeParams){
        var inProgress = 3;


        var vehicles = [];
        var journey;

        function handleComplete() {
            // main function

            if (!--inProgress) {
                $scope.journey = journey;
                $scope.vehicles = vehicles;
                $scope.selectedVehicle = vehicles[0];

                $scope.selectedPerson = null;
                $scope.passengers = [];

                $scope.map = { center: { latitude:  51.5, longitude: 19.5 }, zoom: 6 };

                $scope.theMarkers = [];
                var markers = [];
                var teller = 0;
                journey.passengers.forEach(function(person){
                    var ret = {};
                    if (person.canDrive){
                        if (person.vehicle === null){
                            ret = {latitude: person.location.lat, longitude: person.location.lng, title: person.fullname, id: teller, icon: { url: 'images/bluemarker.png',
                                size: new google.maps.Size(256, 256),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(15, 30),
                                scaledSize: new google.maps.Size(30, 30)}};
                        }else {
                            ret = {latitude: person.location.lat, longitude: person.location.lng, title: person.fullname, id: teller, icon: { url: 'images/greenmarker.png',
                                size: new google.maps.Size(372, 594),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(11.625, 37.125),
                                scaledSize: new google.maps.Size(23.25, 37.125)}};
                        }
                    }else {
                        ret = {latitude: person.location.lat, longitude: person.location.lng, title: person.fullname, id: teller};
                    }

                    markers.push(ret);
                    teller++;
                });
                $scope.theMarkers = markers;
            }
        };

        // before functions
        var Vehicles = $resource('/vehicles/all');

        Vehicles.query(function(objs){
            vehicles = objs;
            handleComplete();
        });


        var Journey = $resource('/journeys/:id', { id:'@_id' }, {
            update: { method: 'PUT' }
        });
        Journey.get({id: $routeParams.id} ,function(obj) {
            journey = obj;
            handleComplete();
        });

        uiGmapGoogleMapApi.then(function(maps) {
            handleComplete();
        });

        // scope functions

        $scope.onClick = function(data){
            $scope.selectedPerson = persons[data.key];
        };

        $scope.addToVehicle = function(){
            if ($scope.passengers.indexOf($scope.selectedPerson) === -1){
                $scope.passengers.push($scope.selectedPerson);
            }
        };


    }]);

routesapp.controller('OverviewCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location){
        var JourneysActive = $resource('/journeys/allActive');

        JourneysActive.query(function(objs){
            $scope.journeysActive = objs;
        });

        var JourneysHistory = $resource('/journeys/allHistory');

        JourneysHistory.query(function(objs){
            $scope.journeysHistory = objs;
        });

        $scope.save = function(){
            var Journeys = $resource('/journeys');
            Journeys.save($scope.journey, function(response){
                $location.path('/journeys/persons/' + response._id);
            });
        };


    }]);

routesapp.controller('PersonsCtrl', ['$scope', '$resource', '$location', 'Upload', '$timeout','$routeParams',
    function($scope, $resource, $location, Upload, $timeout, $routeParams){
        var Journey = $resource('/journeys/:id', { id:'@_id' }, {
            update: { method: 'PUT' }
        });
        var journey;
        $scope.dynamic = 0;

        function refreshPersons(){
            Journey.get({id: $routeParams.id} ,function(obj) {
                journey = obj;
                $scope.journey = journey;
                $scope.persons = journey.persons;

            });
        }

        refreshPersons();

        var nIntervId;

        function updateProgressbar(){
            console.log('test');
            if ($scope.dynamic != 100){
                $scope.dynamic = $scope.dynamic + 1;
            }else {
                clearInterval(nIntervId);
                $scope.show = false;
            }
        };

        // excel fileUpload
        $scope.uploadFiles = function(file, errFiles) {
            $scope.f = file;
            $scope.errFile = errFiles && errFiles[0];
            if (file) {
                file.upload = Upload.upload({
                    url: 'persons/excel/upload',
                    data: {file: file, id:journey._id},
                    method: 'POST'
                });

                file.upload.success(function(response){
                    if (response != -1){
                        var time = response / 5 *1000;
                        $scope.show = true;
                        setTimeout(refreshPersons, (time));

                        nIntervId = setInterval(updateProgressbar, time / 100);

                    }


                });

                //file.upload.then(function (response) {
                //    $timeout(function () {
                //        file.result = response.data;
                //    });
                //}, function (response) {
                //    if (response.status != -1) {
                //        $scope.errorMsg = 'Er is iets misgegaan';
                //    }else {
                //        console.log(response);
                //        refreshPersons();
                //    }
                //}, function (evt) {
                //    file.progress = Math.min(100, parseInt(100.0 *
                //    evt.loaded / evt.total));
                //});
            }
        };


        $scope.save = function(){
            var Journeys = $resource('/journeys');
            Journeys.save($scope.journey, function(response){
                $location.path('/journeys/plan/' + response._id);
            });
        };


    }]);
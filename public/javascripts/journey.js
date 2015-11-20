var routesapp = angular.module("routesapp", ['ngResource', 'ngRoute', 'ngFileUpload' , 'uiGmapgoogle-maps']);
routesapp.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/journey/overview', {
            templateUrl: 'journeys/overview.html',
            controller: 'OverviewCtrl',
            title: 'Reizen overzicht'
        })
        .when('/journey/plan', {
            templateUrl: 'journeys/plan.html',
            controller: 'PlanCtrl',
            title: 'Reis plannen'
        })

}]);

app.controller('PlanCtrl', ['$scope', '$resource', 'uiGmapGoogleMapApi',
    function($scope, $resource, uiGmapGoogleMapApi){
        var inProgress = 3;

        var persons = [];
        var vehicles = [];

        function handleComplete() {
            // main function

            if (!--inProgress) {
                $scope.vehicles = vehicles;
                $scope.selectedVehicle = vehicles[0];

                $scope.selectedPerson = null;
                $scope.passengers = [];

                $scope.map = { center: { latitude:  51.5, longitude: 19.5 }, zoom: 6 };

                $scope.theMarkers = [];
                var markers = [];
                var teller = 0;
                persons.forEach(function(person){
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

        var Persons = $resource('/persons/all');
        Persons.query(function(personobjs) {
            persons = personobjs;
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

routesapp.controller('OverviewCtrl', ['$scope', '$resource',
    function($scope, $resource){
        var JourneysActive = $resource('/journey/allActive');

        JourneysActive.query(function(objs){
            $scope.journeysActive = objs;
        });

        var JourneysHistory = $resource('/journey/allHistory');

        JourneysHistory.query(function(objs){
            $scope.journeysHistory = objs;
        });


    }]);
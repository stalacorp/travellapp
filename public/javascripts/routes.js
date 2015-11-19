var routesapp = angular.module("routesapp", ['ngResource', 'ngRoute', 'ngFileUpload' , 'uiGmapgoogle-maps']);
routesapp.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/routes/map', {
            templateUrl: 'routes/map.html',
            controller: 'NewTravelCtrl',
            title: 'Nieuwe reis'
        })

}]);

app.controller('NewTravelCtrl', ['$scope', '$resource', 'uiGmapGoogleMapApi',
    function($scope, $resource, uiGmapGoogleMapApi){

        var Vehicles = $resource('/vehicles/all');
        var vehicles;
        Vehicles.query(function(objs){
            vehicles = objs;
            $scope.vehicles = objs;
            $scope.selectedVehicle = vehicles[0];
        });
        $scope.selectedPerson = null;

        uiGmapGoogleMapApi.then(function(maps) {
            var Persons = $resource('/persons/all');
            var persons = [];

            Persons.query(function(personobjs){
                persons = personobjs;
                $scope.map = { center: { latitude:  51.5, longitude: 19.5 }, zoom: 6 };

                $scope.onClick = function(data){
                    $scope.selectedPerson = persons[data.key];
                };

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
            });


        });
    }]);
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
        .when('/journeys/vehicles/:id', {
            templateUrl: 'journeys/vehicles.html',
            controller: 'VehiclesCtrl',
            title: "Auto's"
        })

}]);

app.controller('PlanCtrl', ['$scope', '$resource', 'uiGmapGoogleMapApi', '$routeParams',
    function($scope, $resource, uiGmapGoogleMapApi, $routeParams){
        var inProgress = 2;


        var vehicles;
        var persons;
        var journey;
        var owners;
        var position;

        function refreshMap(){

            $scope.theMarkers = [];
            var markers = [];
            var teller = 0;
            journey.persons.forEach(function(person){
                var ret = {};
                if (person.canDrive){
                    if (person.vehicle === null){
                        ret = {latitude: person.location.lat, longitude: person.location.lng, title: person.firstname, id: teller, icon: { url: 'images/bluemarker.png',
                            size: new google.maps.Size(372, 594),
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(11.625, 37.125),
                            scaledSize: new google.maps.Size(23.25, 37.125)}};
                    }else {
                        ret = {latitude: person.location.lat, longitude: person.location.lng, title: person.firstname, id: teller, icon: { url: 'images/greenmarker.png',
                            size: new google.maps.Size(372, 594),
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(11.625, 37.125),
                            scaledSize: new google.maps.Size(23.25, 37.125)}};
                    }
                }else {
                    ret = {latitude: person.location.lat, longitude: person.location.lng, title: person.firstname, id: teller, icon: { url: 'images/redmarker.png',
                        size: new google.maps.Size(372, 594),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(11.625, 37.125),
                        scaledSize: new google.maps.Size(23.25, 37.125)}};
                }

                markers.push(ret);
                teller++;
            });
            $scope.theMarkers = markers;
        };

        function handleComplete() {
            // main function

            if (!--inProgress) {
                $scope.journey = journey;
                $scope.vehicles = journey.vehicles;
                $scope.selectedVehicle = journey.vehicles[0];

                $scope.selectedPerson = null;
                $scope.map = { center: { latitude:  51.5, longitude: 19.5 }, zoom: 6 };

                refreshMap();
            }
        };

        // before functions
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
            $scope.selectedPerson = journey.persons[data.key];
            position = data.key;
            journey.vehicles.forEach(function(v, index){
                if (v.owner != null && v.owner._id == journey.persons[data.key]){
                    $scope.selectedVehicle = journey.vehicles[index];
                }
            });
        };

        $scope.addToVehicle = function(){
            var p = $scope.selectedPerson;
            var v = $scope.selectedVehicle;
            if (!p.isPas){
                $scope.selectedPerson.isPas = true;
                $scope.selectedVehicle.passengers.push(p);
                $scope.theMarkers[position].url = "";
            }
        };


    }]);

routesapp.controller('OverviewCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location){

        // date
        $scope.today = function() {
            $scope.dt = new Date();
        };

        $scope.clear = function () {
            $scope.dt = null;
        };

        $scope.open = function($event) {
            $scope.status.opened = true;
        };

        $scope.openE = function($event) {
            $scope.statusE.opened = true;
        };


        $scope.setDate = function(year, month, day) {
            $scope.dt = new Date(year, month, day);
        };

        $scope.status = {
            opened: false
        };

        $scope.statusE = {
            opened: false
        };


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

        $scope.edit = function(id){
            var Journeys = $resource('/journeys');
            Journeys.save($scope.journey, function(response){
                $location.path('/journeys/persons/' + id);
            });
        };


    }]);

routesapp.controller('PersonsCtrl', ['$scope', '$resource', '$location', 'Upload', '$timeout','$routeParams','$interval',
    function($scope, $resource, $location, Upload, $timeout, $routeParams, $interval){
        var Journey = $resource('/journeys/:id', { id:'@_id' }, {
            update: { method: 'PUT' }
        });
        var journey;
        var persons;

        function refreshPersons(){
            Journey.get({id: $routeParams.id} ,function(obj) {
                journey = obj;
                $scope.journey = journey;
                $scope.persons = journey.persons.slice(0,10);
                $scope.currentPage = 1;
                $scope.totalItems = journey.persons.length;
                $scope.pageChanged();

            });
        };

        refreshPersons();

        $scope.pageChanged = function(){
            $scope.persons = journey.persons.slice($scope.currentPage *10 -10, $scope.currentPage *10);
        };

        $scope.search = function(){
            var searchText = $scope.searchText.toLowerCase();
            persons = journey.persons.filter(function (person){
                return (person.firstname.toLowerCase().indexOf(searchText) != -1 || person.lastname.toLowerCase().indexOf(searchText) != -1);
            });

            $scope.persons = persons.slice(0,10);
            $scope.currentPage = 1;
            $scope.totalItems = persons.length;

        };

        $scope.personId= 0;

        var dynamic = 0;

        function updateProgressbar(){
            dynamic++;
            $scope.dynamic = dynamic;
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
                        var time = response / 5 *1000 + 2000;
                        dynamic = 0;
                        $scope.dynamic = dynamic;
                        $scope.show = true;
                        $timeout(refreshPersons, (time));

                        $interval(updateProgressbar, time / 100, 100);

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

routesapp.controller('VehiclesCtrl', ['$scope', '$resource', '$routeParams',
    function($scope, $resource, $routeParams){
        var Journey = $resource('/journeys/:id', { id:'@_id' }, {
            update: { method: 'PUT' }
        });

        var journey;
        var persons;
        var searchPersons;
        var vehicles;
        var vehicleClicked = 0;
        var previousOwner;
        $scope.vehicleText = 'Toevoegen';

        function refreshPersons(){
            persons = journey.persons.filter(function(person){
                if (person.canDrive && !person.vehicle){
                    return true;
                }
            });
            searchPersons = persons;
            $scope.persons = persons.slice(0,10);
            $scope.totalPersonItems = persons.length;
        };

        function refreshVehicles(){
            $scope.journey = journey;
            refreshPersons();
            $scope.vehicles = journey.vehicles.slice(0,10);
            $scope.currentPage = 1;
            $scope.totalItems = journey.vehicles.length;
        };



        // person dialog
        $scope.pagePersonChanged = function(){
            $scope.persons = searchPersons.slice($scope.currentPersonPage *10 -10, $scope.currentPersonPage *10);
        };


        $scope.searchPerson = function(){
            var searchText = $scope.searchPersonText.toLowerCase();
            searchPersons = persons.filter(function (person){
                return (person.firstname.toLowerCase().indexOf(searchText) != -1 || person.lastname.toLowerCase().indexOf(searchText) != -1);
            });

            $scope.persons = searchPersons.slice(0,10);
            $scope.currentPersonPage = 1;
            $scope.totalPersonItems = searchPersons.length;

        };

        $scope.pick = function(id){
            var vehicle = $scope.vehicles[vehicleClicked];
            var person = $scope.persons[id];
            var Vehicles = $resource('/journeys/updateVehicle');

            vehicle.owner = person;
            $scope.vehicles[vehicleClicked] = vehicle;
            person.vehicle = vehicle;

            var mockVehicle = Object();
            mockVehicle._id = vehicle._id;
            mockVehicle.owner = person._id;

            Vehicles.save(mockVehicle);


            if (typeof(previousOwner) !== 'undefined'){
                journey.persons.forEach(function(p){
                    if (p._id == person._id){
                        p = person;
                    }
                    if (p._id == previousOwner._id){
                        previousOwner.vehicle = null;
                        p = previousOwner;
                    }
                });
            }else {
                persons.forEach(function(p) {
                    if (p._id == person._id) {
                        p = person;
                    }
                });
            }

            $('#ownerModal').modal('hide');
            refreshPersons();
        };

        // vehicles table
        $scope.search = function(){
            var searchText = $scope.searchText.toLowerCase();
            vehicles = journey.vehicles.filter(function (vehicle){
                if (vehicle.owner != null){
                    if (vehicle.owner.firstname.toLowerCase().indexOf(searchText) != -1 || vehicle.owner.lastname.toLowerCase().indexOf(searchText) != -1){
                        return true;
                    }
                }
                return (vehicle.licenceplate.toLowerCase().indexOf(searchText) != -1);
            });

            $scope.vehicles = vehicles.slice(0,10);
            $scope.currentPage = 1;
            $scope.totalItems = vehicles.length;
        };

        $scope.pageChanged = function(){
            $scope.vehicles = $scope.vehicles.slice($scope.currentPage *10 -10, $scope.currentPage *10);
        };

        $scope.vehicleClick = function(id, p){
            vehicleClicked = id;
            previousOwner = p;
        };



        Journey.get({id: $routeParams.id} ,function(obj) {
            journey = obj;
            refreshVehicles();

        });

        // vehicle add/update
        var backupVehicle;
        $scope.update = function(v){
            backupVehicle = angular.copy(v);
            $scope.vehicle = v;
            $scope.vehicleText = 'Wijzigen';
            $scope.isUpdate = true;
        };

        $scope.cancel = function(){
            journey.vehicles.forEach(function (vehicle, index, array){
                if (vehicle._id == backupVehicle._id){
                    array[index] = backupVehicle;
                }
            });
            refreshVehicles();
        };



        $scope.add = function(){
            if ($scope.vehicle._id != null){
                var Vehicles = $resource('/vehicles/:id', { id: '@_id' }, {
                    update: { method: 'PUT' }
                });
                Vehicles.update($scope.vehicle);

            }else {
                var Vehicles = $resource('/journeys/addVehicle');
                $scope.vehicle.journeyId = journey._id;
                Vehicles.save($scope.vehicle, function(response){
                    journey.vehicles.push(response);
                    refreshVehicles();
                });

            }

        };

        // vehicle delete

        $scope.delete = function(){
            journey.vehicles.forEach(function (vehicle, index, array){
                if (vehicle._id == backupVehicle._id){
                    array.splice(index, 1);
                    var Vehicles = $resource('/vehicles/:id');
                    Vehicles.delete({id: vehicle._id });
                    journey.persons.forEach(function(p, index,array){
                        if (p.vehicle == vehicle._id){
                            p.vehicle = null;
                            array[index] = p;
                        }
                    });
                }
            });
            refreshVehicles();
            refreshPersons();

        };


    }]);
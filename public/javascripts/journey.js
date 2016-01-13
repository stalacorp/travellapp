var routesapp = angular.module("routesapp", ['ngResource', 'ngRoute', 'ngFileUpload' , 'ui.bootstrap', 'ngMap']);
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
        .when('/journeys/lastoverview/:id', {
            templateUrl: 'journeys/lastoverview.html',
            controller: 'LastOverviewCtrl',
            title: 'Overzicht reis'
        })
        .when('/journeys/vehicles/:id', {
            templateUrl: 'journeys/vehicles.html',
            controller: 'VehiclesCtrl',
            title: "Auto's"
        })

}]);



app.controller('PlanCtrl', ['$scope', '$resource', '$routeParams','NgMap','$interval',
    function($scope, $resource, $routeParams, NgMap, $interval){
        var inProgress = 2;


        var vehicles;
        var persons;
        var journey;
        var owners;
        var position;
        var map;
        var personIds = [];
        var oldvehicle;
        var calcIndex;
        var oldPerson;
        $scope.remarkPerson;
        $scope.wayPoints = [];
        $scope.deleteShow = false;
        $scope.addShow = true;

        $scope.canDisable = false;

        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true, preserveViewport: true});
        directionsDisplay.suppressMarkers ='true';

        function refreshMap(){
            var lats = [];
            var lngs = [];

            journey.persons = journey.persons.filter(function(p){
               return p.isValid;
            });

            $scope.markers = [];
            var markers = [];
            var teller = 0;
            journey.persons.forEach(function(person){
                personIds.push(person._id);
                var ret = {};
                var lat = person.location.lat;
                var lng = person.location.lng;
                while (lats.indexOf(lat) !== -1 && lngs.indexOf(lng) !== -1){
                    lng += 0.008;
                }
                ret.lat = lat;
                ret.lng = lng;
                ret.pos = teller;
                ret.title = person.firstname + " " + person.lastname;
                ret.icon = {};
                ret.icon.size = [372, 594];
                ret.icon.origin = [0,0];
                ret.icon.anchor = [11.625, 37.125];
                ret.icon.scaledSize = [23.25, 37.125];
                if (person.canDrive){
                    if (person.vehicle === null){
                        if (person.isPas){
                            ret.icon.url = '../images/fadedbluemarker.png';
                        }else {
                            ret.icon.url = '../images/bluemarker.png';

                        }
                        ret.zIndex = 2;

                    }else {
                        var ind = vehicles.map(function (e) {
                            return e.owner._id
                        }).indexOf(person._id);

                        if (ind !== -1 && vehicles[ind].passengers.length >= (vehicles[ind].passengersNr - 2)){
                            ret.icon.url = '../images/fadedgreenmarker.png';
                        }else {
                            ret.icon.url = '../images/greenmarker.png';
                        }

                        ret.zIndex = 5;
                    }
                }else {
                    if (person.isPas){
                        ret.icon.url = '../images/fadedredmarker.png';
                    }else {
                        ret.icon.url = '../images/redmarker.png';
                    }
                    ret.zIndex = 1;
                }

                markers.push(ret);
                teller++;
                lats.push(lat);
                lngs.push(lng);
            });
            $scope.markers = markers;
        };

        function updateDirections(){
            if (typeof($scope.selectedVehicle != 'undefined')) {
                oldvehicle.passengers.forEach(function (p) {

                    if (p.canDrive) {
                        $scope.markers[journey.persons.map(function (e) {
                            return e._id
                        }).indexOf(p._id)].icon.url = "../images/fadedbluemarker.png";
                    } else {
                        $scope.markers[journey.persons.map(function (e) {
                            return e._id
                        }).indexOf(p._id)].icon.url = "../images/fadedredmarker.png";
                    }
                });

                var points = [];

                $scope.selectedVehicle.passengers.forEach(function (p, index, array) {
                    if (p.canDrive) {
                        $scope.markers[journey.persons.map(function (e) {
                            return e._id
                        }).indexOf(p._id)].icon.url = "../images/selectedbluemarker.png";
                    } else {
                        $scope.markers[journey.persons.map(function (e) {
                            return e._id
                        }).indexOf(p._id)].icon.url = "../images/selectedredmarker.png";
                    }
                    points.push({location: {lat: p.location.lat, lng: p.location.lng}, stopover: true});
                });

                directionsService.route({
                    origin: {lat: 50.9591399, lng: 5.5050771},
                    destination: {
                        lat: $scope.selectedVehicle.owner.location.lat,
                        lng: $scope.selectedVehicle.owner.location.lng
                    },
                    travelMode: google.maps.TravelMode.DRIVING,
                    waypoints: points,
                    optimizeWaypoints:true
                }, function (response, status) {

                    if (status === google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                        var distance = 0;
                        var seconds = 0;
                        response.routes[0].legs.forEach(function(l){
                            distance += l.distance.value;
                            seconds += l.duration.value;
                        });

                        var newPassengers = [];
                        response.routes[0].waypoint_order.forEach(function(w){
                            newPassengers.push($scope.selectedVehicle.passengers[w]);
                        });
                        $scope.selectedVehicle.passengers = newPassengers;
                        $scope.$apply($scope.selectedVehicle.passengers);
                        var passengerIds = [];
                        $scope.selectedVehicle.passengers.forEach(function(p){
                            passengerIds.push(p._id);
                        });
                        var mock = {};
                        mock.vehicleId = $scope.selectedVehicle._id;
                        mock.passengers = passengerIds;
                        mock.duration = seconds;
                        mock.distance = distance;

                        var Journey = $resource('/journeys/updatePassengers');
                        Journey.save(mock);

                    }
                });

                oldvehicle = $scope.selectedVehicle;
            }

        }

        function handleComplete() {
            // main function

            if (!--inProgress) {
                directionsDisplay.setMap(map);
                prepareLoad();
            }
        };

        function prepareLoad(){
            $scope.journey = journey;
            vehicles = journey.vehicles.filter(function(v){
                return v.owner;
            });
            $scope.persons = journey.persons;

            $scope.emptyVehicles = journey.vehicles.filter(function(v){
                return !v.owner;
            });

            $scope.selectedEmptyVehicle= $scope.emptyVehicles[0];

            $scope.vehicles = vehicles;
            $scope.selectedVehicle = vehicles[0];
            oldvehicle = vehicles[0];

            $scope.selectedPerson = null;
            $scope.origin = [50.9591399, 5.5050771];

            refreshMap();
            updateDirections();
        }

        // before functions
        var Journey = $resource('/journeys/:id', { id:'@_id' }, {
            update: { method: 'PUT' }
        });
        Journey.get({id: $routeParams.id} ,function(obj) {
            journey = obj;

            if (new Date(journey.startDate) < new Date()){
                $('.canDisable').prop('disabled', true);
                $scope.canDisable = true;
            }
            handleComplete();
        });

        NgMap.getMap().then(function(m) {
            map = m;
            map.setCenter({"lat":51.5 , "lng": 19.5});
            handleComplete();
        });

        // scope functions

        function autoCalcRoute(){



            var v = $scope.vehicles[calcIndex];
            console.log(calcIndex);

            directionsService.route({
                origin: {lat: 50.9591399, lng: 5.5050771},
                destination: {
                    lat: v.owner.location.lat,
                    lng: v.owner.location.lng
                },
                travelMode: google.maps.TravelMode.DRIVING
            }, function (response, status) {

                if (status === google.maps.DirectionsStatus.OK) {
                    var mocks = [];

                    response.routes[0].overview_path.forEach(function(path){


                        journey.persons.forEach(function(p){
                            if (!p.isPas && !p.vehicle) {

                                var distance = getDistanceFromLatLonInKm(path.lat(),path.lng(), p.location.lat, p.location.lng);

                                var mock = {};
                                mock.distance = distance;
                                mock.id = p._id;
                                if (distance < 70){
                                    mocks.push(mock);
                                }

                            }

                        });
                    });


                    mocks.sort(by('distance'));

                    var uniques = [];
                    var teller = 0;
                    var drivers = 0;
                    var max = v.passengersNr -2;
                    while (teller < max && teller < mocks.length){
                        var mock = mocks[teller];
                        if (uniques.map(function (e) {
                                return e.id
                            }).indexOf(mock.id) === -1){
                            var person = journey.persons[journey.persons.map(function(e){
                                return e._id;
                            }).indexOf(mock.id)];

                            console.log(mock.distance);
                            //if (person.canDrive){
                            //    drivers++;
                            //}
                            //if (drivers == 0 && uniques.length == v.passengersNr - 3){
                            //    max++;
                            //}else {
                            //    uniques.push(mock);
                            //}
                            uniques.push(mock);
                        }else {
                            max++;
                        }
                        teller++;
                    }

                    var vehicleMock = {};
                    vehicleMock.passengers = [];

                    var points = [];
                    uniques.forEach(function(u){
                        journey.persons.forEach(function(p, ind, arr){
                            if (p._id === u.id){

                                vehicleMock.passengers.push(p);
                                points.push({location: {lat: p.location.lat, lng: p.location.lng}, stopover: true});
                                arr[ind].isPas = true;
                                //p.isPas = true;
                                //$scope.selectedVehicle.passengers.push(p);
                            }
                        });
                    });

                    directionsService.route({
                        origin: {lat: 50.9591399, lng: 5.5050771},
                        destination: {
                            lat: v.owner.location.lat,
                            lng: v.owner.location.lng
                        },
                        travelMode: google.maps.TravelMode.DRIVING,
                        waypoints: points,
                        optimizeWaypoints:true
                    }, function (response, status) {
                        console.log(status);
                        if (status === google.maps.DirectionsStatus.OK) {

                            var distance = 0;
                            var seconds = 0;
                            response.routes[0].legs.forEach(function(l){
                                distance += l.distance.value;
                                seconds += l.duration.value;
                            });

                            var newPassengers = [];
                            response.routes[0].waypoint_order.forEach(function(w){
                                newPassengers.push(vehicleMock.passengers[w]);
                            });
                            vehicleMock.passengers = newPassengers;

                            var passengerIds = [];
                            vehicleMock.passengers.forEach(function(p){
                                passengerIds.push(p._id);
                            });
                            var mock = {};
                            mock.vehicleId = v._id;
                            mock.passengers = passengerIds;
                            mock.duration = seconds;
                            mock.distance = distance;

                            var JourneyUpdate = $resource('/journeys/updatePassengers');
                            JourneyUpdate.save(mock, function(res){
                                if (calcIndex === $scope.vehicles.length){
                                    var Journey = $resource('/journeys/:id', { id:'@_id' }, {
                                        update: { method: 'PUT' }
                                    });
                                    Journey.get({id: $routeParams.id} ,function(obj) {
                                        journey = obj;
                                        prepareLoad();
                                    });
                                }
                            });
                        }
                    });

                    //$scope.$apply($scope.selectedVehicle.passengers);
                    //updateDirections();

                }
            });
            calcIndex++;
        }

        $scope.autoRoute = function(){
            var JourneyCalc = $resource('/journeys/autoCalc/:id', { id:'@_id' }, {
                update: { method: 'PUT' }
            });
            JourneyCalc.get({id: $routeParams.id} ,function(obj) {

            });
            //calcIndex = 0;
            //console.log($scope.vehicles.length);
            //$interval(autoCalcRoute , 2000, $scope.vehicles.length);

        };

        $scope.personMatch = function(selected){

            if (selected) {
                oldPerson = selected.originalObject;
                var ind = journey.persons.map(function (e) {
                    return e._id
                }).indexOf(oldPerson._id);

                $scope.markers[ind].icon.url = "../images/yellowmarker.png";
                $scope.markers[ind].zIndex = 10;
                map.setZoom(9);
                map.setCenter({"lat":oldPerson.location.lat , "lng": oldPerson.location.lng});
                $scope.onMarkerClick({}, ind);
            }else {
                if (oldPerson !== undefined) {
                    var ind = journey.persons.map(function (e) {
                        return e._id
                    }).indexOf(oldPerson._id);
                    if (oldPerson.canDrive) {
                        if (oldPerson.vehicle) {
                            $scope.markers[ind].icon.url = "../images/greenmarker.png";
                        } else {
                            $scope.markers[ind].icon.url = "../images/bluemarker.png";
                        }

                    } else {
                        $scope.markers[ind].icon.url = "../images/redmarker.png";
                    }
                }
            }
        };

        $scope.clearInput = function () {
            $scope.$broadcast('angucomplete-alt:clearInput');
        }


        $scope.giveVehicle = function(){
            var v = $scope.selectedEmptyVehicle;
            v.owner = $scope.selectedPerson;
            $scope.selectedPerson.vehicle = v;
            $scope.emptyVehicles.pop(v);
            $scope.vehicles.push(v);
            $scope.selectedVehicle = $scope.vehicles[$scope.vehicles.length - 1];

            var Vehicles = $resource('/journeys/updateVehicle');

            var mockVehicle = Object();
            mockVehicle._id = v._id;
            mockVehicle.owner = $scope.selectedPerson._id;

            Vehicles.save(mockVehicle);

            $scope.markers[journey.persons.map(function (e) {
                return e._id
            }).indexOf($scope.selectedPerson._id)].icon.url = "../images/greenmarker.png";
            updateDirections();
        };

        $scope.updateRemark = function(){
            var Persons = $resource('/persons/remark/:id', { id: '@_id' }, {
                update: { method: 'PUT' }
            });

            Persons.update($scope.remarkPerson);
        };

        $scope.giveRemark = function(index){
            $scope.remarkPerson = $scope.selectedVehicle.passengers[index];
        };


        $scope.onMarkerClick = function(data,pos){
            position = pos;
            $scope.selectedPerson = journey.persons[pos];

            vehicles.forEach(function(v, index){
                if (v.owner != null && v.owner._id == journey.persons[pos]._id){
                    $scope.selectedVehicle = vehicles[index];
                    updateDirections();
                }
                if (v.passengers.map(function(e){
                        return e._id;
                    }).indexOf(journey.persons[pos]._id) !== -1){

                    $scope.selectedVehicle = vehicles[index];
                    updateDirections();
                }
            });

            $scope.deleteShow = false;
            $scope.addShow = true;

            if (typeof ($scope.selectedVehicle) !== 'undefined' && typeof($scope.selectedPerson) !== 'undefined'){
                if ($scope.selectedVehicle.passengers.map(function (e) {
                        return e._id
                    }).indexOf($scope.selectedPerson._id) !== -1){
                    $scope.deleteShow = true;
                    $scope.addShow = false;
                }
            }

        };

        $scope.vehicleChange = function(){
            updateDirections();
        };

        $scope.removePassenger = function(id){
            $scope.selectedVehicle.passengers.forEach(function(p, index, array){
                if (p._id == id){
                    array.splice(index, 1);
                    var persindex = journey.persons.map(function (e) {
                        return e._id
                    }).indexOf(p._id);
                    journey.persons[persindex].isPas = false;
                    if (p.canDrive){
                        $scope.markers[persindex].icon.url = '../images/bluemarker.png';
                    }else {
                        $scope.markers[persindex].icon.url = '../images/redmarker.png';
                    }
                    $scope.deleteShow = false;
                    $scope.addShow = true;

                    $scope.markers[journey.persons.map(function (e) {
                        return e._id
                    }).indexOf($scope.selectedVehicle.owner._id)].icon.url = '../images/greenmarker.png';

                    updateDirections();
                }
            });

            if ($scope.selectedVehicle.passengers.length >= $scope.selectedVehicle.passengersNr - 2){
                $scope.markers[journey.persons.map(function (e) {
                    return e._id
                }).indexOf($scope.selectedVehicle.owner._id)].icon.url = '../images/fadedgreenmarker.png';
            }else {
                $scope.markers[journey.persons.map(function (e) {
                    return e._id
                }).indexOf($scope.selectedVehicle.owner._id)].icon.url = '../images/greenmarker.png';
            }
        };

        $scope.addToVehicle = function(){
            var p = $scope.selectedPerson;
            var v = $scope.selectedVehicle;
            if (!p.isPas && v.passengers.length < v.passengersNr - 1){
                $scope.selectedPerson.isPas = true;
                $scope.selectedVehicle.passengers.push(p);

                if (p.canDrive){
                    $scope.markers[position].icon.url = "../images/selectedbluemarker.png";
                }else {
                    $scope.markers[position].icon.url = "../images/selectedredmarker.png";
                }
                //$scope.wayPoints.push({location: {lat: p.location.lat, lng: p.location.lng}, stopover: true});

                $scope.deleteShow = true;
                $scope.addShow = false;

                if (v.passengers.length >= v.passengersNr - 2){
                    $scope.markers[journey.persons.map(function (e) {
                        return e._id
                    }).indexOf(v.owner._id)].icon.url = '../images/fadedgreenmarker.png';
                }

                updateDirections();
            }
        };


    }]);

routesapp.controller('OverviewCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location){
        var inProgress = 2;
        var backupJourney;
        var index;
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

        $scope.open2 = function($event) {
            $scope.status2.opened = true;
        };


        $scope.setDate = function(year, month, day) {
            $scope.dt = new Date(year, month, day);
        };

        $scope.status = {
            opened: false
        };

        $scope.status2 = {
            opened: false
        };

        function handleComplete() {
            // main function

            if (!--inProgress) {
                var journeys = [{name:'', _id: 0}];
                $scope.journeys = journeys.concat($scope.journeysActive).concat($scope.journeysHistory);
                $scope.selectedJourney = $scope.journeys[0];
            }
        };



        var JourneysActive = $resource('/journeys/allActive');

        JourneysActive.query(function(objs){
            $scope.journeysActive = objs;
            handleComplete();
        });

        var JourneysHistory = $resource('/journeys/allHistory');

        JourneysHistory.query(function(objs){
            $scope.journeysHistory = objs;
            handleComplete();
        });

        $scope.setJourney = function(j, ind){
            backupJourney = angular.copy(j);
            $scope.eJourney = j;
            index = ind;


            $('#eName').closest('.form-group').removeClass('has-error');
            $('#eStartDate').closest('.form-group').removeClass('has-error');
        };

        $scope.delete = function(){
            var Journey = $resource('/journeys/:id');
            Journey.delete({id: $scope.eJourney._id });

            $scope.journeysActive.splice(index, 1);
        };

        $scope.editJourney = function(){
            var ok = true;
            var timestamp = Date.parse($scope.eJourney.startDate);

            if (isNaN(timestamp)==true) {
                $('#eStartDate').closest('.form-group').addClass('has-error');
                ok = false;
            }

            if ($scope.eJourney.name.length === 0){
                $('#eName').closest('.form-group').addClass('has-error');
                ok = false;
            }

            if (ok) {
                var Journey = $resource('/journeys/:id', {id: '@_id'}, {
                    update: {method: 'PUT'}
                });

                Journey.update($scope.eJourney);
                $('#journeyModal').modal('hide');
            }
        };

        $scope.cancel = function(){
            $scope.journeysActive[index] = backupJourney;
        };

        $scope.save = function(){
            var Journeys = $resource('/journeys');
            var journey = $scope.journey;
            var timestamp = Date.parse(journey.startDate);
            var ok = true;

            if (isNaN(timestamp)==true) {
                $('#startDate').closest('.form-group').addClass('has-error');
                ok = false;
            }

            if (journey && ok)
                journey.copyId = $scope.selectedJourney._id;
                Journeys.save(journey, function (response) {
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

routesapp.controller('LastOverviewCtrl', ['$scope', '$resource', '$location', '$routeParams',
    function($scope, $resource, $location, $routeParams){
        var Journey = $resource('/journeys/:id', { id:'@_id' }, {
            update: { method: 'PUT' }
        });
        var journey;
        var persons;
        var vehicles;

        Journey.get({id: $routeParams.id} ,function(obj) {
            journey = obj;
            persons = journey.persons;
            vehicles = journey.vehicles;
            $scope.journey = obj;
            $scope.vehicles = vehicles;

            if (vehicles.length != 0){
                $scope.vehicleClick(0);
            }


        });

        $scope.vehicleClick = function(index){
            $scope.selected = index;
            $scope.selectedVehicle = vehicles[index];
            var date = new Date($scope.selectedVehicle.duration * 1000);
            var hh = date.getUTCHours();
            var mm = date.getUTCMinutes();
            $scope.duration = hh + ' uren en ' + mm + ' minuten';
        };

        $scope.updatePdfText = function(){
            var Journey = $resource('/journeys/pdfText/:id', { id:'@_id' }, {
                update: { method: 'PUT' }
            });

            Journey.update($scope.journey);
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
            $scope.journey = journey;
            journey.persons.sort(function(a, b){
                return a.isValid-b.isValid;
            });
            $scope.persons = journey.persons.slice(0,15);
            $scope.currentPage = 1;
            $scope.totalItems = journey.persons.length;
            $scope.pageChanged();
        };

        Journey.get({id: $routeParams.id} ,function(obj) {
            journey = obj;
            if (new Date(journey.startDate) < new Date()){
                $('.canDisable').prop('disabled', true);
            }
            refreshPersons();
        });

        $scope.pageChanged = function(){
            $scope.persons = journey.persons.slice($scope.currentPage *15 -15, $scope.currentPage *15);
        };

        $scope.search = function(){
            var searchText = $scope.searchText.toLowerCase();
            persons = journey.persons.filter(function (person){
                return (person.firstname.toLowerCase().indexOf(searchText) != -1 || person.lastname.toLowerCase().indexOf(searchText) != -1);
            });

            $scope.persons = persons.slice(0,15);
            $scope.currentPage = 1;
            $scope.totalItems = persons.length;

        };

        $scope.personId= 0;

        var dynamic = 0;

        function updateProgressbar(){
            dynamic++;
            $scope.dynamic = dynamic;
            if (dynamic == 100){
                Journey.get({id: $routeParams.id} ,function(obj) {
                    journey = obj;
                    refreshPersons();
                });
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
                        var time = response / 5 *1000 + 2000;
                        dynamic = 0;
                        $scope.dynamic = dynamic;
                        $scope.show = true;

                        $interval(updateProgressbar, time / 100, 100);

                    }


                });

            }
        };

        var backupPerson;
        $scope.update = function(p){
            backupPerson = angular.copy(p);
            $scope.person = p;
            $scope.vehicleText = 'Wijzigen';
            $scope.isUpdate = true;
        };

        $scope.cancel = function(){
            if ($scope.isUpdate){
                journey.persons.forEach(function (p, index, array){
                    if (p._id == backupPerson._id){
                        array[index] = backupPerson;
                    }
                });
                refreshPersons();
            }
        };

        $scope.add = function(){
            if ($scope.person._id != null){
                var Persons = $resource('/persons/:id', { id: '@_id' }, {
                    update: { method: 'PUT' }
                });
                Persons.update($scope.person, function(response){
                    $scope.person.isValid = response.isValid;
                });

            }else {
                var Persons = $resource('/persons');
                $scope.person.journeyId = journey._id;
                Persons.save($scope.person, function(response){
                    journey.persons.push(response);
                    refreshPersons();
                });

            }

        };

        $scope.delete = function(){
            journey.persons.forEach(function (p, index, array){
                if (p._id == backupPerson._id){
                    array.splice(index, 1);
                    var Persons = $resource('/persons/:id');
                    Persons.delete({id: p._id });
                }
            });
            refreshPersons();

        };


        //$scope.save = function(){
        //    var Journeys = $resource('/journeys');
        //    Journeys.save($scope.journey, function(response){
        //        $location.path('/journeys/plan/' + response._id);
        //    });
        //};


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
        var previousOwner = null;
        $scope.canDisable = false;

        $scope.vehicleText = 'Toevoegen';

        function refreshPersons(){
            persons = journey.persons.filter(function(person){
                if (person.canDrive && !person.vehicle){
                    if (person.isValid){
                        return true;
                    }
                    return false;
                }
            });
            searchPersons = persons;
            $scope.persons = persons.slice(0,10);
            $scope.totalPersonItems = persons.length;
        };

        function refreshVehicles(){
            $scope.vehicles = journey.vehicles.slice(0,15);
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


            if (previousOwner !== null){
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
            $scope.searchPersonText = '';
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

            $scope.vehicles = vehicles.slice(0,15);
            $scope.currentPage = 1;
            $scope.totalItems = vehicles.length;
        };

        $scope.pageChanged = function(){
            $scope.vehicles = journey.vehicles.slice($scope.currentPage *15 -15, $scope.currentPage *15);
        };

        $scope.vehicleClick = function(id, p){
            vehicleClicked = id;
            previousOwner = p;
            $scope.hasOwner = false;
            if (p){
                $scope.hasOwner = true;
            }
        };


        function refreshJourney(){
            Journey.get({id: $routeParams.id} ,function(obj) {
                journey = obj;
                $scope.journey = obj;
                if (new Date(journey.startDate) < new Date()){
                    $('.canDisable').prop('disabled', true);
                    $scope.canDisable = true;
                }
                refreshVehicles();
                refreshPersons();

            });
        };
        // page load
        refreshJourney();
        var Journeys = $resource('/journeys/all');
        Journeys.query(function(objs) {
            var filterObjs = objs.filter(function(j){
               return j._id !== $routeParams.id;
            });
            $scope.journeys = filterObjs;
            $scope.selectedJourney = $scope.journeys[0];
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
            if ($scope.isUpdate){
                journey.vehicles.forEach(function (vehicle, index, array){
                    if (vehicle._id == backupVehicle._id){
                        array[index] = backupVehicle;
                    }
                });
                refreshVehicles();
            }
        };


        $scope.import = function(){
            if (typeof($scope.selectedJourney) !== 'undefined') {

                var Vehicles = $resource('/journeys/importVehicles');
                var mock = {};
                mock.currentJourneyId = journey._id;
                mock.importJourneyId = $scope.selectedJourney._id;
                Vehicles.save(mock, function (response) {
                    refreshJourney();
                });
            }
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
        // remove owner
        $scope.removeOwner = function(){
            previousOwner.vehicle = null;
            journey.persons.push(previousOwner);
            $scope.vehicles[vehicleClicked].owner = null;

            var Vehicles = $resource('/vehicles/removeOwner');
            Vehicles.save({id: $scope.vehicles[vehicleClicked]._id});

            refreshPersons();
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

/* sort function*/
var by = function (path, reverse, primer, then) {
    var get = function (obj, path) {
            if (path) {
                path = path.split('.');
                for (var i = 0, len = path.length - 1; i < len; i++) {
                    obj = obj[path[i]];
                };
                return obj[path[len]];
            }
            return obj;
        },
        prime = function (obj) {
            return primer ? primer(get(obj, path)) : get(obj, path);
        };

    return function (a, b) {
        var A = prime(a),
            B = prime(b);

        return (
                (A < B) ? -1 :
                    (A > B) ?  1 :
                        (typeof then === 'function') ? then(a, b) : 0
            ) * [1,-1][+!!reverse];
    };
};

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}
var personsapp = angular.module("personsapp", ['ngResource', 'ngRoute', 'ngFileUpload' , 'uiGmapgoogle-maps']);
personsapp.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/persons/excel', {
            templateUrl: 'persons/excel.html',
            controller: 'ExcelCtrl',
            title: 'Upload excel'
        })
        .when('/persons/location', {
            templateUrl: 'persons/location.html',
            controller: 'LocationCtrl'
        })
        //.when('/persons/map', {
        //    templateUrl: 'persons/map.html',
        //    controller: 'MapCtrl',
        //    title: 'Show the map'
        //})
        .otherwise({
            redirectTo: '/persons/excel'
        });

}]);



personsapp.controller('MapCtrl', ['$scope', '$resource', 'uiGmapGoogleMapApi',
    function($scope, $resource, uiGmapGoogleMapApi){
        var Persons = $resource('/persons/allPersons');
        var persons = [];
        Persons.query(function(personobjs){
            persons = personobjs;
        });

        uiGmapGoogleMapApi.then(function(maps) {

            $scope.map = { center: { latitude:  51.5, longitude: 19.5 }, zoom: 6 };

            $scope.onClick = function(data){
                alert('test');
                console.log(data);
            };
            $scope.theMarkers = [];
            var markers = [];
            persons.forEach(function(person){
                var ret = {};
                if (person.canDrive){
                    if (person.vehicle === null){
                        ret = {latitude: person.location.lat, longitude: person.location.lng, title: person.fullname, id: person._id, icon: { url: 'images/bluemarker.png',
                            size: new google.maps.Size(256, 256),
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(15, 30),
                            scaledSize: new google.maps.Size(30, 30)}};
                    }else {
                        ret = {latitude: person.location.lat, longitude: person.location.lng, title: person.fullname, id: person._id, icon: { url: 'images/greenmarker.png',
                            size: new google.maps.Size(372, 594),
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(11.625, 37.125),
                            scaledSize: new google.maps.Size(23.25, 37.125)}};
                    }

                }else {
                    ret = {latitude: person.location.lat, longitude: person.location.lng, title: person.fullname, id: person._id};
                }

                markers.push(ret);
            });
            $scope.theMarkers = markers;
        });
    }]);

personsapp.controller('ExcelCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.uploadFiles = function(file, errFiles) {
        $scope.f = file;
        $scope.errFile = errFiles && errFiles[0];
        if (file) {
            file.upload = Upload.upload({
                url: 'persons/excel/upload',
                data: {file: file},
                method: 'POST'
            });

            file.upload.then(function (response) {
                $timeout(function () {
                    file.result = response.data;
                });
            }, function (response) {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            }, function (evt) {
                file.progress = Math.min(100, parseInt(100.0 *
                evt.loaded / evt.total));
            });
        }
    }
}]);

app.controller('LocationCtrl', ['$scope', '$resource',
    function($scope, $resource){
        var Videos = $resource('/persons/location');
        Videos.query(function(videos){

        });
    }]);
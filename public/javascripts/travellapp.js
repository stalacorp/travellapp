var app = angular.module("travellapp", ['ngResource', 'ngRoute','personsapp','routesapp', 'angucomplete-alt']);
app.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'main/search.html',
            controller: 'SearchCtrl',
            title:'Zoeken in welke auto',
            access: 'open'
        })
        .when('/login', {templateUrl: 'users/login.html', controller: 'LoginCtrl', title:'Login', access: 'open'})
        .when('/logout', {controller: 'LogoutCtrl'})
        .when('/users', {templateUrl: 'users/overview.html',controller: 'UsersCtrl', access: 'admin'})
        .otherwise({
            redirectTo: '/'
        });
}]);
app.run(['$location', '$rootScope', '$route', 'AuthService', function($location, $rootScope, $route, AuthService) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
    });
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        var isAdmin = AuthService.getUserStatus();
        $rootScope.isLoggedIn = AuthService.isLoggedIn();
        $rootScope.isAdmin = isAdmin;

        if (next.access !== 'open') {
            if ((AuthService.isLoggedIn() === false && next.access === undefined) || (next.access === 'admin' && isAdmin !== true)) {
                $location.path('/login');
                $route.reload();
            }
        }
    });
}]);

app.controller('NavCtrl', ['$scope', '$location', 'AuthService',
    function($scope, $location, AuthService){
        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };
    }]);

app.controller('LoginCtrl',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {

            console.log(AuthService.getUserStatus());

            $scope.login = function () {

                // initial values
                $scope.error = false;
                $scope.disabled = true;

                // call login from service
                AuthService.login($scope.loginForm.username, $scope.loginForm.password)
                    // handle success
                    .then(function () {
                        $location.path('/journeys/overview');
                        $scope.disabled = false;
                        $scope.loginForm = {};
                    })
                    // handle error
                    .catch(function () {
                        $scope.error = true;
                        $scope.errorMessage = "Onjuiste gebruikersnaam en/of wachtwoord";
                        $scope.disabled = false;
                        $scope.loginForm = {};
                    });

            };

        }]);
app.controller('LogoutCtrl',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {
            $scope.logout = function () {

                // call logout from service
                AuthService.logout()
                    .then(function () {
                        $location.path('/login');
                    });

            };

        }]);

app.controller('UsersCtrl',
    ['$scope', '$location', '$resource',
        function ($scope, $location, $resource) {



        }]);

app.controller('SearchCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location){

        $scope.active = false;
        $scope.found = false;
        var journey;
        var JourneysActive = $resource('/journeys/upcoming');


        JourneysActive.get(function(obj){
            if (obj){
                journey = obj;
                $scope.active = true;
                journey.persons.forEach(function(p){
                    p.fullname = p.firstname + " " + p.lastname;
                });

                $scope.persons = journey.persons;
            }

        });

        $scope.personMatch = function(selected) {
            $scope.found = false;
            if (selected) {
                var person = selected.originalObject;
                $scope.person = person._id;

                journey.vehicles.forEach(function(v){
                    if (v.owner._id == person._id){
                        $scope.vehicle = v;
                        $scope.found = true;
                    }

                    v.passengers.forEach(function(p){
                        if (p._id == person._id){
                            $scope.vehicle = v;
                            $scope.found = true;
                        }
                    });
                });

                if ($scope.vehicle) {
                    var date = new Date($scope.vehicle.duration * 1000);
                    var hh = date.getUTCHours();
                    var mm = date.getUTCMinutes();

                    $scope.duration = hh + ' uren en ' + mm + ' minuten';
                }
            }
        };

        $scope.clearInput = function () {
            $scope.$broadcast('angucomplete-alt:clearInput');
        };


    }]);


